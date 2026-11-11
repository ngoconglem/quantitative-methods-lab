import { useEffect, useMemo, useState } from "react";
import { apa, datasetFromCsv, fmt, loadSample, type Dataset, type ItemMeta } from "../lib/data";
import * as S from "../lib/stats";
import { CorrHeatmap, DistBars, ScreePlot } from "../components/charts";

type Step = "data" | "items" | "reliability" | "structure" | "report";
const STEPS: { key: Step; label: string }[] = [
  { key: "data", label: "Data" },
  { key: "items", label: "Items" },
  { key: "reliability", label: "Reliability" },
  { key: "structure", label: "Factor structure" },
  { key: "report", label: "Report" },
];

function skewness(xs: number[]) {
  const n = xs.length;
  const m = xs.reduce((a, b) => a + b, 0) / n;
  const s2 = xs.reduce((a, b) => a + (b - m) ** 2, 0) / n;
  const s3 = xs.reduce((a, b) => a + (b - m) ** 3, 0) / n;
  return s3 / Math.pow(s2, 1.5);
}

async function copy(text: string, done: (ok: boolean) => void) {
  try {
    await navigator.clipboard.writeText(text);
    done(true);
  } catch {
    done(false);
  }
}

export default function Analyse({ initialSample }: { initialSample?: "writing_ai_simulated" | "bfi" }) {
  const [step, setStep] = useState<Step>("data");
  const [ds, setDs] = useState<Dataset | null>(null);
  const [items, setItems] = useState<ItemMeta[]>([]);
  const [range, setRange] = useState<[number, number]>([1, 5]);
  const [error, setError] = useState<string | null>(null);
  const [nFactors, setNFactors] = useState<number | null>(null);
  const [rotation, setRotation] = useState<S.Rotation>("oblimin");
  const [cut, setCut] = useState(0.4);
  const [pa, setPa] = useState<{ key: string; values: number[] } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const useDataset = (d: Dataset, keepReverse: boolean) => {
    setDs(d);
    setItems(d.items.map((it) => ({ ...it, reverse: keepReverse ? it.reverse : false })));
    setRange(d.scale);
    setNFactors(null);
    setPa(null);
    setError(null);
  };

  const pickSample = async (key: "writing_ai_simulated" | "bfi") => {
    try {
      const d = await loadSample(key);
      // The simulated file is deliberately left un-recoded so learners can find the problem.
      useDataset(d, key === "bfi");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    if (initialSample) pickSample(initialSample);
  }, [initialSample]);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      useDataset(datasetFromCsv(await f.text(), f.name), false);
    } catch (e) {
      setError((e as Error).message);
      setDs(null);
    }
  };

  // ------------------------------------------------------------ derived data
  const prepared = useMemo(() => {
    if (!ds) return null;
    const rev = items.map((it, j) => (it.reverse ? j : -1)).filter((j) => j >= 0);
    const raw = ds.X.map((r) => r.map((v, j) => (v !== null && rev.includes(j) ? range[0] + range[1] - v : v)));
    const complete = S.listwise(raw);
    return { raw, complete };
  }, [ds, items, range]);

  const itemTable = useMemo(() => {
    if (!ds || !prepared) return [];
    return items.map((it, j) => {
      const col = prepared.raw.map((r) => r[j]).filter((v): v is number => v !== null);
      const n = col.length;
      const m = col.reduce((a, b) => a + b, 0) / n;
      const sd = Math.sqrt(col.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1));
      const counts = Array.from({ length: range[1] - range[0] + 1 }, (_, k) => col.filter((v) => Math.round(v) === range[0] + k).length);
      return {
        ...it,
        n,
        missingPct: (100 * (ds.X.length - n)) / ds.X.length,
        mean: m,
        sd,
        skew: skewness(col),
        floor: (100 * counts[0]) / n,
        ceiling: (100 * counts[counts.length - 1]) / n,
        counts,
      };
    });
  }, [ds, prepared, items, range]);

  const subscales = useMemo(() => {
    if (!prepared) return [];
    const groups = new Map<string, number[]>();
    items.forEach((it, j) => groups.set(it.subscale, [...(groups.get(it.subscale) ?? []), j]));
    return [...groups.entries()]
      .filter(([, cols]) => cols.length >= 2)
      .map(([name, cols]) => {
        const X = S.listwise(prepared.raw.map((r) => cols.map((j) => r[j])));
        if (X.length < 10) return { name, cols, n: X.length, error: "Too few complete responses (at least 10 needed)." };
        try {
          const R = S.corr(X);
          const alpha = S.cronbachAlpha(X);
          const off = R.flatMap((r, i) => r.filter((_, k) => k > i));
          return {
            name,
            cols,
            n: X.length,
            alpha,
            ci: S.alphaCI(alpha, X.length, cols.length),
            omega: cols.length >= 3 ? S.omegaTotal(R) : NaN,
            meanR: off.reduce((a, b) => a + b, 0) / off.length,
            items: S.itemStats(X),
          };
        } catch (e) {
          return { name, cols, n: X.length, error: (e as Error).message };
        }
      });
  }, [prepared, items]);

  const structure = useMemo(() => {
    if (!prepared || prepared.complete.length < 10 || items.length < 3) return null;
    try {
      const R = S.corr(prepared.complete);
      return { R, kmo: S.kmo(R), bartlett: S.bartlett(R, prepared.complete.length), eig: S.eigSym(R).values };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [prepared, items.length]);

  // Parallel analysis is the slowest step, so it runs after the page has painted.
  const paKey = prepared ? `${ds?.key}:${prepared.complete.length}:${items.length}` : "";
  useEffect(() => {
    if (!prepared || !structure || "error" in structure || pa?.key === paKey) return;
    const id = setTimeout(() => {
      const iters = prepared.complete.length * items.length > 40000 ? 50 : 100;
      setPa({ key: paKey, values: S.parallelAnalysis(prepared.complete.length, items.length, iters, 2026, 95) });
    }, 30);
    return () => clearTimeout(id);
  }, [paKey, structure]);

  const suggested = useMemo(() => {
    if (!structure || "error" in structure || !pa || pa.key !== paKey) return undefined;
    let k = 0;
    while (k < structure.eig.length && structure.eig[k] > pa.values[k]) k++;
    return k;
  }, [structure, pa, paKey]);

  const m = nFactors ?? Math.max(1, suggested ?? 1);

  const fa = useMemo(() => {
    if (!structure || "error" in structure) return null;
    try {
      return S.efa(structure.R, Math.min(m, items.length - 1), rotation);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [structure, m, rotation, items.length]);

  const assignment = useMemo(() => {
    if (!fa || "error" in fa) return null;
    return fa.loadings.map((row) => {
      const abs = row.map(Math.abs);
      const order = abs.map((v, k) => [v, k]).sort((a, b) => b[0] - a[0]);
      const [first, second] = order;
      return {
        factor: first[1],
        primary: row[first[1]],
        weak: first[0] < cut,
        cross: (second?.[0] ?? 0) >= 0.3,
      };
    });
  }, [fa, cut]);

  // ------------------------------------------------------------ report text
  const report = useMemo(() => {
    if (!ds || !prepared || !structure || "error" in structure || !fa || "error" in fa || !assignment) return null;
    const p = items.length;
    const rev = items.filter((i) => i.reverse).map((i) => i.id);
    const varExp = (100 * fa.communalities.reduce((a, b) => a + b, 0)) / p;
    const offPhi = fa.phi.flatMap((r, i) => r.filter((_, k) => k > i));
    const problems = items.filter((_, j) => assignment[j].weak || assignment[j].cross).map((it) => it.id);
    const relLines = subscales
      .filter((s) => !("error" in s))
      .map((s) => {
        const r = s as Extract<(typeof subscales)[number], { alpha: number }>;
        return `${r.name}: α = ${apa(r.alpha)}, 95% CI [${apa(r.ci[0])}, ${apa(r.ci[1])}]${Number.isFinite(r.omega) ? `, ω = ${apa(r.omega)}` : ""}`;
      });
    const pTxt = structure.bartlett.p < 0.001 ? "p < .001" : `p = ${apa(structure.bartlett.p, 3)}`;
    const text = [
      `Responses from ${ds.X.length} participants to ${p} items were analysed; ${prepared.complete.length} participants with complete responses were retained for the factor analysis (listwise deletion).${rev.length ? ` Negatively worded items (${rev.join(", ")}) were reverse-scored before analysis.` : ""}`,
      `Bartlett's test of sphericity was significant, χ²(${structure.bartlett.df}) = ${fmt(structure.bartlett.chi2, 2)}, ${pTxt}, and the Kaiser–Meyer–Olkin measure of sampling adequacy was ${apa(structure.kmo.overall)}, indicating that the correlation matrix was suitable for factor analysis.`,
      suggested !== undefined
        ? `Parallel analysis (Horn, 1965), comparing observed eigenvalues with the 95th percentile of eigenvalues from random data, suggested retaining ${suggested} factor${suggested === 1 ? "" : "s"}.`
        : "",
      `An exploratory factor analysis using principal axis factoring with ${rotation === "none" ? "no rotation" : `${rotation} rotation`} extracted ${m} factor${m === 1 ? "" : "s"}, accounting for ${fmt(varExp, 1)}% of the common variance in the items (root mean square of residuals = ${apa(fa.rmsr, 3)}).${
        rotation === "oblimin" && m > 1 ? ` Factor correlations ranged from ${apa(Math.min(...offPhi))} to ${apa(Math.max(...offPhi))}.` : ""
      }`,
      problems.length
        ? `Using a salience criterion of |λ| ≥ ${apa(cut)}, ${problems.length < 10 ? ["", "one item", "two items", "three items", "four items", "five items", "six items", "seven items", "eight items", "nine items"][problems.length] : `${problems.length} items`} (${problems.join(", ")}) either failed to load saliently on any factor or cross-loaded (|λ| ≥ .30) on a second factor and should be reviewed.`
        : `All items loaded saliently (|λ| ≥ ${apa(cut)}) on one factor without cross-loadings of .30 or above.`,
      relLines.length ? `Internal consistency was estimated for each subscale: ${relLines.join("; ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const factorItems = Array.from({ length: m }, (_, k) => items.filter((_, j) => assignment[j].factor === k && !assignment[j].weak).map((i) => i.id));
    const excluded = items.filter((_, j) => assignment[j].weak).map((i) => i.id);
    const names = factorItems.map((_, k) => `F${k + 1}`);
    const lavaan = [
      `# Confirmatory factor analysis to test the structure found above, in a NEW sample.`,
      `# Generated by the Scale Validation Lab. Factor names are placeholders: rename them.`,
      excluded.length ? `# Items below the salience criterion, left out: ${excluded.join(", ")}` : null,
      `library(lavaan)`,
      ``,
      `model <- '`,
      ...factorItems.map((its, k) => (its.length ? `  ${names[k]} =~ ${its.join(" + ")}` : `  # ${names[k]}: no items met the criterion`)),
      `'`,
      ``,
      `# Ordinal items: WLSMV estimation on polychoric correlations`,
      `fit <- cfa(model, data = mydata, ordered = TRUE, estimator = "WLSMV")`,
      `summary(fit, fit.measures = TRUE, standardized = TRUE)`,
    ]
      .filter((l) => l !== null)
      .join("\n");
    return { text, lavaan };
  }, [ds, prepared, structure, fa, assignment, subscales, items, suggested, rotation, m, cut]);

  // ------------------------------------------------------------ render
  const ready = ds && prepared;
  const go = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <h1>Analyse a scale</h1>
      <p className="lede">Five steps from raw responses to a reportable account of your scale's internal structure. Everything runs in your browser.</p>

      <ol className="steps-nav" aria-label="Analysis steps">
        {STEPS.map((s) => (
          <li key={s.key}>
            <a
              href="#analyse"
              aria-current={step === s.key ? "step" : undefined}
              onClick={(e) => {
                e.preventDefault();
                if (s.key === "data" || ready) go(s.key);
              }}
              style={!ready && s.key !== "data" ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ol>

      {error && <p className="error">{error}</p>}

      {/* ---------------- STEP 1: DATA ---------------- */}
      {step === "data" && (
        <section>
          <h2 style={{ marginTop: 0 }}>1. Load responses</h2>
          <div className="two-col">
            <div className="panel" style={{ margin: 0 }}>
              <h3 style={{ marginTop: 0 }}>Use a sample dataset</h3>
              <p className="small">
                <strong>Academic Writing with AI (simulated).</strong> 15 items, 320 respondents, three subscales, with four planted problems to
                find.
              </p>
              <button onClick={() => pickSample("writing_ai_simulated")}>Load simulated questionnaire</button>
              <p className="small" style={{ marginTop: 14 }}>
                <strong>Big Five Inventory items (bfi).</strong> 25 personality items, 2,800 real respondents, five traits (psychTools, Revelle).
              </p>
              <button className="quiet" onClick={() => pickSample("bfi")}>
                Load bfi
              </button>
            </div>
            <div className="panel" style={{ margin: 0 }}>
              <h3 style={{ marginTop: 0 }}>Or use your own file</h3>
              <p className="small">
                A CSV file with one row per respondent and one column per item, numeric responses (for example 1–5), item names in the first
                row. Blank, NA and −99 count as missing. Non-numeric columns such as IDs or comments are set aside automatically.
              </p>
              <input type="file" accept=".csv,.tsv,.txt,text/csv" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Choose a CSV file" />
              <p className="small muted" style={{ marginTop: 10, marginBottom: 0 }}>
                Your file is read on this page and never uploaded. Remove names and other identifying details first.
              </p>
            </div>
          </div>

          {ds && prepared && (
            <>
              <div className="stat-grid">
                <div className="stat"><div className="value">{ds.X.length.toLocaleString()}</div><div className="label">respondents</div></div>
                <div className="stat"><div className="value">{items.length}</div><div className="label">items</div></div>
                <div className="stat"><div className="value">{prepared.complete.length.toLocaleString()}</div><div className="label">with no missing responses</div></div>
                <div className="stat"><div className="value">{range[0]}–{range[1]}</div><div className="label">response scale</div></div>
              </div>
              <p className="small muted">{ds.source}{ds.scaleLabels ? ` Scale: ${ds.scaleLabels}.` : ""}</p>
              {ds.dropped.length > 0 && <p className="small">Set aside as non-item columns: {ds.dropped.join(", ")}.</p>}

              <h3>Check subscales and reverse-scored items</h3>
              <p className="small" style={{ maxWidth: "var(--measure)" }}>
                Subscales group items for reliability. For your own files they are guessed from item names (SE1, SE2 → SE); edit them if
                needed. Tick items that are worded in the opposite direction to their subscale. Reversed scores are computed as{" "}
                {range[0]} + {range[1]} − response.
              </p>
              <div className="controls">
                <label className="field">
                  Lowest response
                  <input type="text" inputMode="numeric" value={range[0]} onChange={(e) => setRange([Number(e.target.value) || 0, range[1]])} style={{ width: 80 }} />
                </label>
                <label className="field">
                  Highest response
                  <input type="text" inputMode="numeric" value={range[1]} onChange={(e) => setRange([range[0], Number(e.target.value) || 0])} style={{ width: 80 }} />
                </label>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Wording</th>
                      <th>Subscale</th>
                      <th>Reverse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, j) => (
                      <tr key={it.id}>
                        <td><strong>{it.id}</strong></td>
                        <td className="item-text">{it.text ?? "–"}</td>
                        <td>
                          <input
                            type="text"
                            value={it.subscale}
                            aria-label={`Subscale for ${it.id}`}
                            onChange={(e) => setItems(items.map((x, k) => (k === j ? { ...x, subscale: e.target.value } : x)))}
                            style={{ width: "100%", minWidth: 120 }}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={it.reverse}
                            aria-label={`Reverse-score ${it.id}`}
                            onChange={(e) => setItems(items.map((x, k) => (k === j ? { ...x, reverse: e.target.checked } : x)))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {ds.key === "writing_ai_simulated" && (
                <p className="callout small">
                  This file has four planted problems, and nothing is reverse-scored yet. Try running the analysis as it is first, then fix what
                  you find.
                </p>
              )}
              <p style={{ marginTop: 20 }}>
                <button onClick={() => go("items")}>Next: inspect the items</button>
              </p>
            </>
          )}
        </section>
      )}

      {/* ---------------- STEP 2: ITEMS ---------------- */}
      {step === "items" && ready && (
        <section>
          <h2 style={{ marginTop: 0 }}>2. Inspect the items</h2>
          <p className="prose small">
            Look for items with many missing responses, little variation, or most answers piled at one end of the scale (floor or ceiling
            above 15%). Such items carry little information and weaken correlations. Flags are prompts to look closer, not verdicts.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Missing</th>
                  <th className="num">Mean</th>
                  <th className="num">SD</th>
                  <th className="num">Skew</th>
                  <th className="num">Floor</th>
                  <th className="num">Ceiling</th>
                  <th>Responses</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {itemTable.map((it) => {
                  const flags = [
                    it.missingPct > 5 && "missing > 5%",
                    it.sd < 0.6 && "low variation",
                    Math.abs(it.skew) > 2 && "highly skewed",
                    it.floor > 15 && "floor effect",
                    it.ceiling > 15 && "ceiling effect",
                  ].filter(Boolean) as string[];
                  return (
                    <tr key={it.id} className={flags.length ? "flagged" : undefined}>
                      <td>
                        <strong>{it.id}</strong>
                        {it.reverse && <span className="small muted"> (reversed)</span>}
                      </td>
                      <td className="num">{fmt(it.missingPct, 1)}%</td>
                      <td className="num">{fmt(it.mean)}</td>
                      <td className="num">{fmt(it.sd)}</td>
                      <td className="num">{fmt(it.skew)}</td>
                      <td className="num">{fmt(it.floor, 0)}%</td>
                      <td className="num">{fmt(it.ceiling, 0)}%</td>
                      <td><DistBars counts={it.counts} lo={range[0]} /></td>
                      <td>{flags.map((f) => <span key={f} className="badge" style={{ marginRight: 4 }}>{f}</span>)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 20 }}>
            <button onClick={() => go("reliability")}>Next: reliability</button>
          </p>
        </section>
      )}

      {/* ---------------- STEP 3: RELIABILITY ---------------- */}
      {step === "reliability" && ready && (
        <section>
          <h2 style={{ marginTop: 0 }}>3. Reliability of each subscale</h2>
          <p className="prose small">
            Cronbach's alpha assumes every item measures the construct equally well; McDonald's omega relaxes that assumption and is usually
            the better estimate. A corrected item-total correlation below .30 suggests an item fits the subscale poorly. A negative one almost
            always means a reverse-worded item has not been reverse-scored. See <a href="#learn">Learn</a> for more.
          </p>
          {subscales.length === 0 && <p className="muted">No subscale has two or more items. Assign subscales in step 1.</p>}
          {subscales.map((s) => (
            <div key={s.name} style={{ marginTop: 28 }}>
              <h3 style={{ marginBottom: 4 }}>{s.name}</h3>
              <p className="small muted" style={{ marginTop: 0 }}>{s.cols.length} items · {s.n} complete responses</p>
              {"error" in s ? (
                <p className="error">{s.error}</p>
              ) : (
                <>
                  <div className="stat-grid">
                    <div className="stat">
                      <div className="value">{apa(s.alpha)}</div>
                      <div className="label">Cronbach's α, 95% CI [{apa(s.ci[0])}, {apa(s.ci[1])}]</div>
                    </div>
                    <div className="stat">
                      <div className="value">{apa(s.omega)}</div>
                      <div className="label">McDonald's ω (total)</div>
                    </div>
                    <div className="stat">
                      <div className="value">{apa(s.meanR)}</div>
                      <div className="label">mean inter-item correlation</div>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table style={{ maxWidth: 760 }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th className="num">Corrected item-total r</th>
                          <th className="num">α if item deleted</th>
                          <th>Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.items.map((st, k) => {
                          const it = items[s.cols[k]];
                          const flags = [
                            st.citc < 0 && "negative: reverse-scored?",
                            st.citc >= 0 && st.citc < 0.3 && "weak fit (< .30)",
                            st.alphaIfDeleted > s.alpha + 0.01 && "α rises without it",
                          ].filter(Boolean) as string[];
                          return (
                            <tr key={it.id} className={flags.length ? "flagged" : undefined}>
                              <td>
                                <strong>{it.id}</strong> {it.text && <span className="item-text">{it.text}</span>}
                              </td>
                              <td className="num">{apa(st.citc)}</td>
                              <td className="num">{apa(st.alphaIfDeleted)}</td>
                              <td>{flags.map((f) => <span key={f} className="badge" style={{ marginRight: 4 }}>{f}</span>)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ))}
          <p style={{ marginTop: 24 }}>
            <button onClick={() => go("structure")}>Next: factor structure</button>
          </p>
        </section>
      )}

      {/* ---------------- STEP 4: STRUCTURE ---------------- */}
      {step === "structure" && ready && (
        <section>
          <h2 style={{ marginTop: 0 }}>4. Factor structure</h2>
          {!structure ? (
            <p className="error">At least 10 complete responses and 3 items are needed.</p>
          ) : "error" in structure ? (
            <p className="error">{structure.error}</p>
          ) : (
            <>
              <h3>Are the items suitable for factor analysis?</h3>
              <div className="stat-grid">
                <div className="stat">
                  <div className="value">{apa(structure.kmo.overall)}</div>
                  <div className="label">
                    Kaiser–Meyer–Olkin (KMO){" "}
                    {structure.kmo.overall >= 0.8 ? <span className="badge ok">good</span> : structure.kmo.overall >= 0.6 ? <span className="badge ok">adequate</span> : <span className="badge">low</span>}
                  </div>
                </div>
                <div className="stat">
                  <div className="value">{fmt(structure.bartlett.chi2, 0)}</div>
                  <div className="label">
                    Bartlett's χ²({structure.bartlett.df}), {structure.bartlett.p < 0.001 ? "p < .001" : `p = ${apa(structure.bartlett.p, 3)}`}
                  </div>
                </div>
                <div className="stat">
                  <div className="value">{prepared.complete.length.toLocaleString()}</div>
                  <div className="label">complete responses ({fmt(prepared.complete.length / items.length, 1)} per item)</div>
                </div>
              </div>
              {structure.kmo.perItem.some((v) => v < 0.6) && (
                <p className="small">
                  <span className="flag">Items with KMO below .60:</span>{" "}
                  {items
                    .map((it, j) => ({ id: it.id, v: structure.kmo.perItem[j] }))
                    .filter((x) => x.v < 0.6)
                    .map((x) => `${x.id} (${apa(x.v)})`)
                    .join(", ")}
                </p>
              )}

              <h3>Inter-item correlations</h3>
              <CorrHeatmap labels={items.map((i) => i.id)} R={structure.R} />

              <h3>How many factors?</h3>
              <p className="prose small">
                Parallel analysis compares your eigenvalues with those from random data of the same size. Retain the factors whose eigenvalues
                beat the random ones. It is more accurate than the eigenvalue-greater-than-one rule, which tends to keep too many factors.
              </p>
              <ScreePlot observed={structure.eig} random={pa?.key === paKey ? pa.values : undefined} suggested={suggested} />
              {suggested === undefined && <p className="small muted">Running parallel analysis…</p>}

              <h3>Factor loadings</h3>
              <div className="controls">
                <label className="field">
                  Factors to extract
                  <select value={m} onChange={(e) => setNFactors(Number(e.target.value))}>
                    {Array.from({ length: Math.min(10, items.length - 1) }, (_, k) => k + 1).map((k) => (
                      <option key={k} value={k}>
                        {k}
                        {k === suggested ? " (parallel analysis)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Rotation
                  <select value={rotation} onChange={(e) => setRotation(e.target.value as S.Rotation)}>
                    <option value="oblimin">Oblimin (factors may correlate)</option>
                    <option value="varimax">Varimax (factors kept uncorrelated)</option>
                    <option value="none">None</option>
                  </select>
                </label>
                <label className="field" style={{ minWidth: 220 }}>
                  Salient loading: |λ| ≥ {apa(cut)}
                  <input type="range" min={0.3} max={0.5} step={0.05} value={cut} onChange={(e) => setCut(Number(e.target.value))} />
                </label>
              </div>
              {fa && "error" in fa && <p className="error">{fa.error}</p>}
              {fa && !("error" in fa) && assignment && (
                <>
                  <p className="small muted">
                    Principal axis factoring, {rotation === "none" ? "unrotated" : rotation}. Salient loadings are in bold. Root mean square of
                    residuals: {apa(fa.rmsr, 3)} (below .05 suggests the factors reproduce the correlations well).
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          {Array.from({ length: m }, (_, k) => <th key={k} className="num">F{k + 1}</th>)}
                          <th className="num">h²</th>
                          <th>Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, j) => {
                          const a = assignment[j];
                          const flags = [a.weak && "no salient loading", a.cross && "cross-loading", !a.weak && !a.cross && a.primary < 0 && "negative loading: reverse-scored?", fa.communalities[j] >= 0.99 && "Heywood case"].filter(Boolean) as string[];
                          return (
                            <tr key={it.id} className={flags.length ? "flagged" : undefined}>
                              <td>
                                <strong>{it.id}</strong> <span className="item-text">{it.subscale}</span>
                              </td>
                              {fa.loadings[j].map((v, k) => (
                                <td key={k} className="load" style={{ fontWeight: Math.abs(v) >= cut ? 700 : 400, color: Math.abs(v) >= cut ? "var(--ink)" : "var(--ink-3)", background: Math.abs(v) >= cut ? (v > 0 ? "#e8f1fc" : "#fbe7e4") : undefined }}>
                                  {apa(v)}
                                </td>
                              ))}
                              <td className="load">{apa(fa.communalities[j])}</td>
                              <td>{flags.map((f) => <span key={f} className="badge" style={{ marginRight: 4 }}>{f}</span>)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {rotation === "oblimin" && m > 1 && (
                    <>
                      <h3>Factor correlations</h3>
                      <table style={{ maxWidth: 80 + m * 80 }}>
                        <thead>
                          <tr>
                            <th />
                            {fa.phi.map((_, k) => <th key={k} className="num">F{k + 1}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {fa.phi.map((r, i) => (
                            <tr key={i}>
                              <th>F{i + 1}</th>
                              {r.map((v, k) => <td key={k} className="load">{k <= i ? apa(v) : ""}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              )}
              <p style={{ marginTop: 24 }}>
                <button onClick={() => go("report")}>Next: report</button>
              </p>
            </>
          )}
        </section>
      )}

      {/* ---------------- STEP 5: REPORT ---------------- */}
      {step === "report" && ready && (
        <section>
          <h2 style={{ marginTop: 0 }}>5. Report</h2>
          {!report ? (
            <p className="muted">Complete the factor-structure step first.</p>
          ) : (
            <>
              <p className="prose small">
                A draft results paragraph in APA style, built from your current settings. Edit it: name the factors, interpret them, and say why
                you chose the number of factors and the rotation.
              </p>
              <div className="panel prose" style={{ maxWidth: "var(--measure)" }}>
                <p style={{ margin: 0 }}>{report.text}</p>
              </div>
              <div className="chips">
                <button className="chip" onClick={() => copy(report.text, (ok) => setCopied(ok ? "text" : "fail"))}>
                  {copied === "text" ? "Copied" : "Copy paragraph"}
                </button>
              </div>

              <h3>Next step: confirm the structure in R</h3>
              <p className="prose small">
                Exploratory results should be confirmed with confirmatory factor analysis (CFA) in a new sample. This lavaan syntax assigns each
                item to the factor it loads on most strongly and leaves out items below the salience criterion.
              </p>
              <pre className="code">{report.lavaan}</pre>
              <div className="chips">
                <button className="chip" onClick={() => copy(report.lavaan, (ok) => setCopied(ok ? "lavaan" : "fail"))}>
                  {copied === "lavaan" ? "Copied" : "Copy R code"}
                </button>
              </div>
              {copied === "fail" && <p className="small muted">Copying is blocked here. Select the text and copy it by hand.</p>}

              <h3>Before you report, check that you have</h3>
              <ul className="prose">
                <li>described the sample, how it was recruited, and how missing data were handled;</li>
                <li>justified the number of factors with more than one criterion (parallel analysis, interpretability, theory);</li>
                <li>stated the extraction method and rotation, and why an oblique or orthogonal rotation fits your construct;</li>
                <li>reported all loadings (including non-salient ones) and the factor correlations;</li>
                <li>reported reliability per subscale with confidence intervals, and preferred ω when loadings differ;</li>
                <li>noted that internal structure is one source of validity evidence; content, response processes, relations to other variables and consequences need evidence too (AERA, APA, &amp; NCME, 2014).</li>
              </ul>
            </>
          )}
        </section>
      )}
    </>
  );
}
