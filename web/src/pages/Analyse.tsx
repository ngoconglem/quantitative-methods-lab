import { useEffect, useMemo, useState } from "react";
import { apa, datasetFromCsv, fmt, loadSample, type Dataset, type ItemMeta } from "../lib/data";
import * as S from "../lib/stats";
import { CorrHeatmap, DistBars, ScreePlot } from "../components/charts";
import { Guide, Term } from "../components/Guide";

function relVerdict(a: number) {
  if (!Number.isFinite(a)) return { word: "not available", tone: "flag" };
  if (a >= 0.95) return { word: "very high, possibly redundant items", tone: "ok" };
  if (a >= 0.9) return { word: "excellent", tone: "ok" };
  if (a >= 0.8) return { word: "good", tone: "ok" };
  if (a >= 0.7) return { word: "acceptable", tone: "ok" };
  if (a >= 0.6) return { word: "questionable", tone: "flag" };
  return { word: "poor", tone: "flag" };
}

function list(xs: string[]) {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

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
      `# Load your responses (one row per person, one column per item)`,
      `mydata <- read.csv("${ds.key.startsWith("upload:") ? ds.name : `${ds.key}.csv`}")`,
      ...(rev.length
        ? [``, `# Reverse-score the negatively worded items, as in the analysis above`, ...rev.map((id) => `mydata$${id} <- ${range[0] + range[1]} - mydata$${id}`)]
        : []),
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
  }, [ds, prepared, structure, fa, assignment, subscales, items, suggested, rotation, m, cut, range]);

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

      {step === "data" && (
        <Guide title="What the five steps do">
          <ol>
            <li>
              <strong>Data</strong>: load responses and tell the lab which items belong together and which are worded negatively.
            </li>
            <li>
              <strong>Items</strong>: check each question on its own. Did people skip it? Did almost everyone give the same answer?
            </li>
            <li>
              <strong>Reliability</strong>: check that the items in each subscale hang together, so the total score is consistent.
            </li>
            <li>
              <strong>Factor structure</strong>: check that the items group into the subscales you intended, without being told which is
              which.
            </li>
            <li>
              <strong>Report</strong>: get a draft results paragraph and R code for the next study.
            </li>
          </ol>
          <p>
            New to this? Load the simulated questionnaire first and follow the guidance boxes at each step. The whole run takes about 20
            minutes.
          </p>
        </Guide>
      )}

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
              <Guide title="What your file should look like">
                <div className="table-wrap">
                  <table className="mini">
                    <thead>
                      <tr>
                        <th>id</th>
                        <th>SE1</th>
                        <th>SE2</th>
                        <th>SE3</th>
                        <th>CE1</th>
                        <th>…</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>p001</td><td>4</td><td>5</td><td>4</td><td>2</td><td>…</td></tr>
                      <tr><td>p002</td><td>3</td><td>3</td><td></td><td>4</td><td>…</td></tr>
                    </tbody>
                  </table>
                </div>
                <ul>
                  <li>
                    From <strong>Excel or Google Sheets</strong>: File → Save as (or Download) → CSV. From <strong>Qualtrics</strong>: export
                    as CSV with numeric values, then delete the two extra header rows. From <strong>SPSS</strong>: File → Export → CSV.
                  </li>
                  <li>
                    Name items with a shared prefix per subscale (SE1, SE2, CE1…) and the lab will group them for you. A blank cell is treated as
                    a skipped answer.
                  </li>
                  <li>
                    To see a complete example, download the{" "}
                    <a href="./data/writing_ai_simulated.csv" download>
                      simulated questionnaire as CSV
                    </a>
                    .
                  </li>
                </ul>
              </Guide>
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
                <div className="stat"><div className="value">{prepared.complete.length.toLocaleString()}</div><div className="label">with no <Term id="missing">missing responses</Term></div></div>
                <div className="stat"><div className="value">{range[0]}–{range[1]}</div><div className="label">response scale</div></div>
              </div>
              <p className="small muted">{ds.source}{ds.scaleLabels ? ` Scale: ${ds.scaleLabels}.` : ""}</p>
              {ds.dropped.length > 0 && <p className="small">Set aside as non-item columns: {ds.dropped.join(", ")}.</p>}

              <h3>Check subscales and reverse-scored items</h3>
              <Guide title="Two things to check before you go on">
                <ol>
                  <li>
                    <strong>Subscales.</strong> Each item should be assigned to the <Term id="subscale">subscale</Term> it was written for. Items
                    with the same subscale name are analysed together in step 3.
                  </li>
                  <li>
                    <strong>Reverse-worded items.</strong> Read each item's wording. If agreeing with an item means the <em>opposite</em> of
                    agreeing with the rest of its subscale, tick <em>Reverse</em> so its scores are flipped (<Term id="reverse">why?</Term>). On
                    a {range[0]}–{range[1]} scale, {range[1]} becomes {range[0]}, {range[1] - 1} becomes {range[0] + 1}, and so on.
                  </li>
                </ol>
                <p>Not sure? Leave it as it is: step 3 will show you any item that behaves as if it should have been reversed.</p>
              </Guide>
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
          <Guide title="What each column means">
            <ul>
              <li>
                <strong>Missing</strong>: the share of people who skipped the item. Above 5% is worth asking why: was it unclear, sensitive or
                not applicable?
              </li>
              <li>
                <strong>Mean</strong> and <strong>SD</strong>: the average answer and how spread out the answers are (
                <Term id="sd">standard deviation</Term>). A very small SD means nearly everyone gave the same answer.
              </li>
              <li>
                <strong>Skew</strong>: whether answers are lopsided (<Term id="skew">more</Term>). Negative values mean most people agreed.
              </li>
              <li>
                <strong>Floor</strong> and <strong>Ceiling</strong>: the share choosing the lowest and highest option (
                <Term id="floor-ceiling">why it matters</Term>).
              </li>
              <li>
                <strong>Responses</strong>: a small bar chart of how many people chose each option, from {range[0]} on the left to {range[1]}{" "}
                on the right.
              </li>
            </ul>
            <p>
              Flagged rows are shaded. A flag is a reason to reread the item, not to delete it: an item everyone agrees with may still matter
              for the content of the scale.
            </p>
          </Guide>
          {(() => {
            const flagged = itemTable.filter(
              (it) => it.missingPct > 5 || it.sd < 0.6 || Math.abs(it.skew) > 2 || it.floor > 15 || it.ceiling > 15,
            );
            return (
              <p className="verdict" style={{ marginBottom: 12 }}>
                {flagged.length === 0 ? (
                  <>
                    <strong>No item is flagged.</strong> Responses are spread across the scale with little missing data. Go on to reliability.
                  </>
                ) : (
                  <>
                    <strong>
                      {flagged.length} of {itemTable.length} items flagged:
                    </strong>{" "}
                    {list(flagged.map((f) => f.id))}. Read their wording and keep them in mind in the next steps.
                  </>
                )}
              </p>
            );
          })()}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num"><Term id="missing">Missing</Term></th>
                  <th className="num"><Term id="mean">Mean</Term></th>
                  <th className="num"><Term id="sd">SD</Term></th>
                  <th className="num"><Term id="skew">Skew</Term></th>
                  <th className="num"><Term id="floor-ceiling">Floor</Term></th>
                  <th className="num"><Term id="floor-ceiling">Ceiling</Term></th>
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
          <Guide title="How to read this step">
            <p>
              <Term id="reliability">Reliability</Term> asks: do the items in a subscale give consistent answers? If they all measure the same
              thing, a person who agrees with one should tend to agree with the others. For each subscale you get three numbers:
            </p>
            <ul>
              <li>
                <strong>
                  <Term id="alpha">Cronbach's α</Term>
                </strong>
                , from 0 to 1. Common benchmarks: .70 acceptable, .80 good, .90 excellent. The range in brackets is a 95%{" "}
                <Term id="ci">confidence interval</Term>: smaller samples give wider ranges.
              </li>
              <li>
                <strong>
                  <Term id="omega">McDonald's ω</Term>
                </strong>
                : read it like alpha. It is usually the more accurate of the two; if they disagree, report ω.
              </li>
              <li>
                <strong>
                  <Term id="mean-r">Mean inter-item correlation</Term>
                </strong>
                : between about .15 and .50 is typical of a focused subscale.
              </li>
            </ul>
            <p>
              The table under each subscale shows which items are responsible. Look first at the{" "}
              <Term id="citc">corrected item-total r</Term> column: every value should be positive and ideally .30 or above.
            </p>
          </Guide>
          {subscales.length === 0 && <p className="muted">No subscale has two or more items. Assign subscales in step 1.</p>}
          {subscales.map((s) => (
            <div key={s.name} style={{ marginTop: 28 }}>
              <h3 style={{ marginBottom: 4 }}>{s.name}</h3>
              <p className="small muted" style={{ marginTop: 0 }}>{s.cols.length} items · {s.n} complete responses</p>
              {"error" in s ? (
                <p className="error">{s.error}</p>
              ) : (
                <>
                  {(() => {
                    const v = relVerdict(s.alpha);
                    const neg = s.items.map((st, k) => (st.citc < 0 ? items[s.cols[k]].id : "")).filter(Boolean);
                    const weak = s.items.map((st, k) => (st.citc >= 0 && st.citc < 0.3 ? items[s.cols[k]].id : "")).filter(Boolean);
                    const rises = s.items
                      .map((st, k) => (st.citc >= 0.3 && st.alphaIfDeleted > s.alpha + 0.01 ? { id: items[s.cols[k]].id, a: st.alphaIfDeleted } : null))
                      .filter((x): x is { id: string; a: number } => x !== null);
                    return (
                      <p className="verdict">
                        Reliability is <strong className={v.tone === "flag" ? "flag-text" : undefined}>{v.word}</strong> (α = {apa(s.alpha)}
                        {Number.isFinite(s.omega) ? `, ω = ${apa(s.omega)}` : ""}).{" "}
                        {neg.length > 0 && (
                          <>
                            {list(neg)} correlate{neg.length === 1 ? "s" : ""} <strong>negatively</strong> with the rest of the subscale. Read
                            {neg.length === 1 ? " its" : " their"} wording: if agreeing means the opposite of the other items, go back to step 1
                            and tick Reverse.{" "}
                          </>
                        )}
                        {weak.length > 0 && (
                          <>
                            {list(weak)} {weak.length === 1 ? "fits" : "fit"} the subscale only weakly (below .30); check whether{" "}
                            {weak.length === 1 ? "it measures" : "they measure"} something different from the other items.
                          </>
                        )}
                        {rises.length > 0 && (
                          <>
                            Alpha would rise to {apa(rises[0].a)} without {rises[0].id}
                            {rises.length > 1 ? ` (and also without ${list(rises.slice(1).map((r) => r.id))})` : ""}: read{" "}
                            {rises.length === 1 ? "its" : "their"} wording before deciding, because dropping an item also narrows what the
                            subscale covers.
                          </>
                        )}
                        {neg.length === 0 && weak.length === 0 && rises.length === 0 && <>Every item fits the subscale well.</>}
                      </p>
                    );
                  })()}
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
                          <th className="num"><Term id="citc">Corrected item-total r</Term></th>
                          <th className="num"><Term id="alpha-deleted">α if item deleted</Term></th>
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
              <Guide title="What this step does">
                <p>
                  Steps 2 and 3 took your subscales as given. This step checks them. <Term id="efa">Exploratory factor analysis</Term> looks only
                  at how the items correlate and asks how many underlying dimensions (<Term id="factor">factors</Term>) explain the pattern, and
                  which items belong to each. If your questionnaire works as designed, the factors should match your subscales.
                </p>
                <p>Work down the page in order: is the data suitable, how many factors, which items load where.</p>
              </Guide>

              <h3>Are the items suitable for factor analysis?</h3>
              <div className="stat-grid">
                <div className="stat">
                  <div className="value">{apa(structure.kmo.overall)}</div>
                  <div className="label">
                    <Term id="kmo">Kaiser–Meyer–Olkin (KMO)</Term>{" "}
                    {structure.kmo.overall >= 0.8 ? <span className="badge ok">good</span> : structure.kmo.overall >= 0.6 ? <span className="badge ok">adequate</span> : <span className="badge">low</span>}
                  </div>
                </div>
                <div className="stat">
                  <div className="value">{fmt(structure.bartlett.chi2, 0)}</div>
                  <div className="label">
                    <Term id="bartlett">Bartlett's</Term> χ²({structure.bartlett.df}), {structure.bartlett.p < 0.001 ? "p < .001" : `p = ${apa(structure.bartlett.p, 3)}`}
                  </div>
                </div>
                <div className="stat">
                  <div className="value">{prepared.complete.length.toLocaleString()}</div>
                  <div className="label">complete responses ({fmt(prepared.complete.length / items.length, 1)} per item)</div>
                </div>
              </div>
              <p className="verdict">
                {structure.kmo.overall >= 0.6 && structure.bartlett.p < 0.05 ? (
                  <>
                    <strong>Yes.</strong> The items share enough in common (KMO {apa(structure.kmo.overall)}, where .60 is the usual minimum and
                    .80 good) and are clearly correlated (Bartlett's test significant). Factor analysis is worthwhile.
                  </>
                ) : (
                  <>
                    <strong>Caution.</strong> {structure.kmo.overall < 0.6 ? `KMO is ${apa(structure.kmo.overall)}, below the usual minimum of .60: the items share little in common. ` : ""}
                    {structure.bartlett.p >= 0.05 ? "Bartlett's test is not significant: the items are barely correlated. " : ""}
                    Results below may be unstable; check the sample size and the items with low KMO.
                  </>
                )}{" "}
                {prepared.complete.length < 150 && (
                  <>
                    With {prepared.complete.length} complete responses the sample is small, so treat the results as a first look (
                    <Term id="sample-size">how many do I need?</Term>).
                  </>
                )}
              </p>
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
              <Guide>
                <p>
                  This <Term id="corr-matrix">correlation matrix</Term> shows how every pair of items is related. Darker blue means a stronger
                  positive <Term id="correlation">correlation</Term>; red means a negative one. Items that measure the same thing form dark
                  blocks. Look for an item whose row is pale (it relates to nothing) or red (it may need reverse-scoring).
                </p>
              </Guide>
              <CorrHeatmap labels={items.map((i) => i.id)} R={structure.R} />

              <h3>How many factors?</h3>
              <p className="prose small">
                <Term id="parallel">Parallel analysis</Term> compares your <Term id="eigenvalue">eigenvalues</Term> with those from random data of
                the same size. Retain the factors whose eigenvalues beat the random ones. It is more accurate than the{" "}
                <Term id="kaiser-rule">eigenvalue-greater-than-one rule</Term>, which tends to keep too many factors.
              </p>
              <Guide title="How to read the chart">
                <p>
                  This is a <Term id="scree">scree plot</Term>. Each point is one possible factor, from strongest (left) to weakest (right). The
                  solid blue line is your data; the dashed orange line is what random data of the same size would give. Count the points where your line is
                  above the random line: that is how many real factors the data support.
                </p>
              </Guide>
              <ScreePlot observed={structure.eig} random={pa?.key === paKey ? pa.values : undefined} suggested={suggested} />
              {suggested === undefined && <p className="small muted">Running parallel analysis…</p>}
              {suggested !== undefined && (() => {
                const k = new Set(items.map((i) => i.subscale)).size;
                return (
                  <p className="verdict">
                    <strong>
                      Parallel analysis suggests {suggested} factor{suggested === 1 ? "" : "s"}.
                    </strong>{" "}
                    {suggested === k ? (
                      <>That matches the {k} subscale{k === 1 ? "" : "s"} you defined, a good sign. The loadings below show whether the items sort into them as intended.</>
                    ) : (
                      <>
                        You defined {k} subscale{k === 1 ? "" : "s"}. A mismatch is worth investigating: try both numbers in the “Factors to
                        extract” menu below and see which solution makes more sense of the items.
                      </>
                    )}
                  </p>
                );
              })()}

              <h3>Factor loadings</h3>
              <Guide title="How to read the loadings table">
                <ul>
                  <li>
                    Each column F1, F2… is a factor. Each number is a <Term id="loading">loading</Term>: how strongly the item relates to that
                    factor. Loadings at or above the cut-off (<Term id="salient">salient</Term>) are shown in bold and shaded blue (positive) or
                    red (negative).
                  </li>
                  <li>
                    Ideally every item has <strong>one</strong> bold loading, and items from the same subscale share a column.
                  </li>
                  <li>
                    <strong>h²</strong> is the <Term id="communality">communality</Term>: how much of the item the factors explain together.
                    Below about .20 is low.
                  </li>
                  <li>
                    The three settings: how many factors to extract (start with the parallel-analysis suggestion);{" "}
                    <Term id="rotation">rotation</Term> (keep <Term id="oblimin">oblimin</Term> unless you have a reason to assume unrelated
                    factors); and the cut-off for a salient loading (.40 is conventional).
                  </li>
                </ul>
                <p>
                  Flags: <em>no salient loading</em> means the item fits no factor; <em>cross-loading</em> means it loads .30 or more on two
                  factors (<Term id="cross-loading">more</Term>); a <em>negative loading</em> on its main factor may mean a missed reverse-score;
                  a <em>Heywood case</em> signals an impossible estimate (<Term id="heywood">more</Term>).
                </p>
              </Guide>
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
                    <Term id="paf">Principal axis factoring</Term>, {rotation === "none" ? "unrotated" : rotation}. Salient loadings are in bold.{" "}
                    <Term id="rmsr">Root mean square of residuals</Term>: {apa(fa.rmsr, 3)} (below .05 suggests the factors reproduce the
                    correlations well).
                  </p>
                  <div className="verdict factor-summary">
                    <p style={{ margin: "0 0 4px" }}>
                      <strong>What the factors contain</strong>
                    </p>
                    <ul>
                      {Array.from({ length: m }, (_, k) => {
                        const its = items.filter((_, j) => assignment[j].factor === k && !assignment[j].weak);
                        const counts = new Map<string, number>();
                        its.forEach((i) => counts.set(i.subscale, (counts.get(i.subscale) ?? 0) + 1));
                        const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
                        return (
                          <li key={k}>
                            <strong>F{k + 1}</strong>:{" "}
                            {its.length === 0 ? (
                              <>no item loads saliently; this factor may be one too many.</>
                            ) : (
                              <>
                                {list(its.map((i) => (assignment[items.indexOf(i)].primary < 0 ? `${i.id} (negative)` : i.id)))}
                                {top && (
                                  <>
                                    {" "}
                                    ({top[1] === its.length ? "all" : `${top[1]} of ${its.length}`} from <em>{top[0]}</em>)
                                  </>
                                )}
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {(() => {
                      const bad = items.filter((_, j) => assignment[j].weak || assignment[j].cross).map((i) => i.id);
                      const neg = items.filter((_, j) => !assignment[j].weak && !assignment[j].cross && assignment[j].primary < 0).map((i) => i.id);
                      return (
                        <>
                          {bad.length > 0 && (
                            <p style={{ margin: "4px 0 0" }}>
                              <strong>To review:</strong> {list(bad)}. Reread these items: do they ask about two things at once, or about
                              something the subscale was not meant to cover?
                            </p>
                          )}
                          {neg.length > 0 && (
                            <p style={{ margin: "4px 0 0" }}>
                              <strong>Negative loading:</strong> {list(neg)} {neg.length === 1 ? "runs" : "run"} in the opposite direction to
                              the other items on {neg.length === 1 ? "its" : "their"} factor. If {neg.length === 1 ? "it is" : "they are"}{" "}
                              worded negatively, tick Reverse in step 1.
                            </p>
                          )}
                          {bad.length === 0 && neg.length === 0 && <p style={{ margin: "4px 0 0" }}>Every item loads clearly on one factor.</p>}
                        </>
                      );
                    })()}
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          {Array.from({ length: m }, (_, k) => <th key={k} className="num">F{k + 1}</th>)}
                          <th className="num"><Term id="communality">h²</Term></th>
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
                      <p className="small" style={{ maxWidth: "var(--measure)" }}>
                        How strongly the factors are related to each other (<Term id="phi">more</Term>). Moderate correlations are normal for
                        related constructs; above about .80 suggests two factors may really be one.
                      </p>
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
                A draft results paragraph in <Term id="apa">APA style</Term>, built from your current settings. Edit it: name the factors,
                interpret them, and say why you chose the number of factors and the rotation.
              </p>
              <Guide title="Turning this into your results section">
                <ol>
                  <li>Copy the paragraph into your document. It changes whenever you change a setting, so finalise the settings first.</li>
                  <li>
                    Replace “F1”, “F2” with names that describe what the items on each factor have in common (use the “What the factors
                    contain” list from step 4).
                  </li>
                  <li>Add a table of all loadings (you can copy it from step 4) and say what you will do about any items flagged for review.</li>
                  <li>Work through the checklist at the bottom of this page.</li>
                </ol>
              </Guide>
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
                Exploratory results should be confirmed with <Term id="cfa">confirmatory factor analysis (CFA)</Term> in a new sample. This{" "}
                <Term id="lavaan">lavaan</Term> syntax assigns each item to the factor it loads on most strongly and leaves out items below the
                salience criterion.
              </p>
              <Guide title="Running the code for the first time">
                <ol>
                  <li>
                    Install R from <a href="https://cran.r-project.org">cran.r-project.org</a> and, if you like, RStudio from{" "}
                    <a href="https://posit.co/download/rstudio-desktop/">posit.co</a>. Both are free.
                  </li>
                  <li>
                    In R, run <code>install.packages("lavaan")</code> once.
                  </li>
                  <li>
                    Put your CSV file in R's working folder (in RStudio: Session → Set Working Directory), or change the file name in the{" "}
                    <code>read.csv</code> line to its full path.
                  </li>
                  <li>
                    Paste the code and run it. In the output, look at CFI and TLI (.95 or above is good) and RMSEA and SRMR (.06 and .08 or below
                    are good), then at the standardised loadings.
                  </li>
                </ol>
              </Guide>
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
