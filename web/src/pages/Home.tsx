import { useMemo, useState } from "react";
import { apa, useSample } from "../lib/data";
import * as S from "../lib/stats";

/** The memorable moment: one un-reversed item drags a subscale's alpha from .80 to .32. */
export default function Home() {
  const { data, error } = useSample("writing_ai_simulated");
  const [fixed, setFixed] = useState(false);

  const demo = useMemo(() => {
    if (!data) return null;
    const cols = data.items.map((it, j) => (it.subscale === "Critical evaluation of AI output" ? j : -1)).filter((j) => j >= 0);
    const rev = data.items.findIndex((it) => it.id === "CE4");
    const X = S.listwise(data.X.map((r) => cols.map((j) => r[j])));
    const k = cols.indexOf(rev);
    const Xf = X.map((r) => r.map((v, j) => (j === k ? data.scale[0] + data.scale[1] - v : v)));
    const run = (M: S.Mat) => ({ alpha: S.cronbachAlpha(M), items: S.itemStats(M) });
    return { ids: cols.map((j) => data.items[j]), raw: run(X), fixed: run(Xf), n: X.length };
  }, [data]);

  const cur = demo ? (fixed ? demo.fixed : demo.raw) : null;

  return (
    <>
      <section className="hero">
        <h1 style={{ maxWidth: "20ch" }}>Check that your questionnaire measures what you think it measures.</h1>
        <p className="lede">
          The Scale Validation Lab takes questionnaire responses through item screening, reliability and exploratory factor analysis to a draft
          results paragraph and confirmatory-analysis code. It runs in your browser, explains every number, and is built for teaching as much as
          for analysis.
        </p>

        <div className="hero-demo" aria-live="polite">
          <div>
            <p className="small" style={{ marginTop: 0, color: "var(--ink-2)" }}>
              Subscale “Critical evaluation of AI output”, simulated data, n = {demo?.n ?? "…"}
            </p>
            <div className="big-alpha" style={{ color: fixed ? "var(--ok)" : "var(--flag)" }}>{cur ? apa(cur.alpha) : "…"}</div>
            <p style={{ marginTop: 4 }}>Cronbach's α</p>
            <button onClick={() => setFixed(!fixed)} disabled={!demo}>
              {fixed ? "Undo: score CE4 as it is" : "Reverse-score CE4"}
            </button>
            <p className="small muted" style={{ marginTop: 12 }}>
              {fixed
                ? "With CE4 reverse-scored, every item correlates positively with the rest of the subscale."
                : "CE4 is worded in the opposite direction to the other four items, and has not been reverse-scored."}
            </p>
          </div>
          <div>
            {error && <p className="error">{error}</p>}
            {demo && cur && (
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num" style={{ width: "13em" }}>Correlation with the rest</th>
                  </tr>
                </thead>
                <tbody>
                  {demo.ids.map((it, k) => {
                    const r = cur.items[k].citc;
                    return (
                      <tr key={it.id} className={r < 0 ? "flagged" : undefined}>
                        <td>
                          <strong>{it.id}</strong> <span className="item-text">{it.text}</span>
                        </td>
                        <td>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 3.2em", alignItems: "center", gap: 0 }}>
                            <span style={{ display: "flex", justifyContent: "flex-end" }}>
                              {r < 0 && <span style={{ height: 12, width: `${Math.abs(r) * 100}%`, background: "var(--flag)", borderRadius: "4px 0 0 4px" }} />}
                            </span>
                            <span style={{ borderLeft: "1px solid var(--ink-3)", height: 18, display: "flex", alignItems: "center" }}>
                              {r >= 0 && <span style={{ height: 12, width: `${r * 100}%`, background: "var(--s1)", borderRadius: "0 4px 4px 0" }} />}
                            </span>
                            <span className="num" style={{ textAlign: "right", fontWeight: 500 }}>{apa(r)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <h2>Start here</h2>
      <ul className="index">
        <li>
          <a href="#analyse">
            <span className="index-title">Analyse a scale</span>
            <span className="index-desc">
              Five steps: load data, inspect items, estimate reliability (α with confidence intervals, ω), test factor structure (KMO, Bartlett,
              parallel analysis, rotated loadings) and draft a report with lavaan code for confirmatory analysis.
            </span>
          </a>
        </li>
        <li>
          <a href="#analyse-simulated">
            <span className="index-title">Find the four planted problems</span>
            <span className="index-desc">
              Load the simulated “Academic Writing with AI” questionnaire. It hides an un-reversed item, a weak item, a cross-loading item and
              missing data. Can you find them all?
            </span>
          </a>
        </li>
        <li>
          <a href="#learn">
            <span className="index-title">Learn the ideas</span>
            <span className="index-desc">
              Short explanations of alpha and omega, factorability, parallel analysis, extraction and rotation, with the key references and
              common misreadings.
            </span>
          </a>
        </li>
        <li>
          <a href="#teach">
            <span className="index-title">Teach with it</span>
            <span className="index-desc">Session plans for a methods seminar, an HDR workshop on validating your own instrument, and a lecture demonstration.</span>
          </a>
        </li>
      </ul>
    </>
  );
}
