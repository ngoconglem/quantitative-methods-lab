import { useMemo, useState } from "react";
import { apa, useSample } from "../lib/data";
import * as S from "../lib/stats";
import { Guide, Term } from "../components/Guide";
import { MODULES } from "../lib/modules";

/** Home: the method chooser, the six modules, and the alpha demonstration from Module 6. */
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
        <h1 style={{ maxWidth: "22ch" }}>Quantitative methods for language research, explained with real data.</h1>
        <p className="lede">
          Six interactive modules take you from describing your numbers to regression, categorical data and questionnaire validation. Each
          explains the idea in plain words, works through real language data, lets you try it, checks your understanding, and shows how to
          report it and run it in R or Python.
        </p>
        <Chooser />
      </section>

      <h2>The six modules</h2>
      <ol className="module-cards">
        {MODULES.map((m, i) => (
          <li key={m.key}>
            <a href={m.href}>
              <span className="module-card-n">Module {i + 1}</span>
              <span className="module-card-title">{m.title}</span>
              <span className="module-card-q">{m.question}</span>
              <span className="module-card-data">Data: {m.data}</span>
            </a>
          </li>
        ))}
      </ol>

      <h2>New here?</h2>
      <p style={{ maxWidth: "var(--measure)" }}>
        You do not need statistics software or a statistics degree. Start with Module 1 and work in order, or use the chooser above to go
        straight to the method you need. Terms with a dotted underline open a short definition; the shaded boxes are guidance, which experienced
        users can hide with the <strong>Guidance</strong> switch at the top of the page. Every result is computed in your browser and checked
        against SciPy and statsmodels.
      </p>

      <section className="feature-demo">
        <h2>From Module 6: one badly scored item</h2>
        <Guide title="What you are looking at">
          <p>
            Five <Term id="item">questionnaire items</Term> are meant to measure one thing: how critically students evaluate AI output. If they
            do, people who agree with one item should tend to agree with the others. The big number,{" "}
            <Term id="alpha">Cronbach's alpha</Term>, sums this up on a 0 to 1 scale; .70 or more is the usual minimum for research (Nunnally, 1978).
          </p>
          <p>
            The bars show each item's <Term id="citc">correlation with the rest</Term> of the subscale. One bar points the wrong way: CE4 is
            worded negatively (“I <em>accept</em> AI-generated references without checking them”), so agreeing with it means the opposite of
            agreeing with the others. Press the button to <Term id="reverse">reverse-score</Term> it and watch alpha recover.
          </p>
        </Guide>

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

      <h2>Everything on the site</h2>
      <ul className="index">
        <li>
          <a href="#analyse-simulated">
            <span className="index-title">Find the four planted problems</span>
            <span className="index-desc">
              Load the simulated “Academic Writing with AI” questionnaire in Module 6. It hides an un-reversed item, a weak item, a cross-loading
              item and missing data. Can you find them all?
            </span>
          </a>
        </li>
        <li>
          <a href="#learn">
            <span className="index-title">Measurement: background reading</span>
            <span className="index-desc">
              Short explanations of alpha and omega, factorability, parallel analysis, extraction and rotation, with every cut-off and its source.
            </span>
          </a>
        </li>
        <li>
          <a href="#teach">
            <span className="index-title">Teach with it</span>
            <span className="index-desc">Session plans for a methods course, an HDR workshop on validating your own instrument, and lecture demonstrations.</span>
          </a>
        </li>
        <li>
          <a href="#glossary">
            <span className="index-title">Glossary</span>
            <span className="index-desc">Every statistical term on the site in plain language, with rules of thumb for reading each number.</span>
          </a>
        </li>
        <li>
          <a href="#about">
            <span className="index-title">About and data</span>
            <span className="index-desc">The four real datasets, how every result is verified, and the author's related research.</span>
          </a>
        </li>
      </ul>
    </>
  );
}

function Chooser() {
  const [outcome, setOutcome] = useState<"number" | "category" | "items" | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const pick = (key: string) => MODULES.find((m) => m.key === key)!;
  const rec =
    outcome === "category"
      ? { m: pick("categorical"), why: "Your outcome is a choice between categories, so use a chi-square test for one factor and logistic regression for several." }
      : outcome === "items"
        ? { m: pick("analyse"), why: "Several items meant to measure one thing call for reliability analysis and factor analysis before you combine them into a score." }
        : outcome === "number" && goal
          ? {
              describe: { m: pick("describe"), why: "Start by looking at the middle, the spread and the shape: it decides which summaries and tests are safe." },
              correlate: { m: pick("correlate"), why: "Two numerical measures from the same cases: a correlation tells you how closely they move together." },
              groups: { m: pick("groups"), why: "A numerical outcome and two groups: compare the means, and report the size of the difference as well as the p-value." },
              regress: { m: pick("regress"), why: "Several predictors of one numerical outcome: linear regression estimates each one's contribution while holding the others constant." },
            }[goal]!
          : null;
  return (
    <div className="chooser" aria-live="polite">
      <p className="chooser-title">Which method do I need?</p>
      <p className="chooser-q">1. What kind of outcome are you studying?</p>
      <div className="chips" role="group">
        {[
          ["number", "A number (a score, a time, a rating)"],
          ["category", "A choice between categories (which form, pass or fail)"],
          ["items", "Several questionnaire items meant to measure one thing"],
        ].map(([k, label]) => (
          <button
            key={k}
            className="chip"
            aria-pressed={outcome === k}
            onClick={() => {
              setOutcome(k as typeof outcome);
              setGoal(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {outcome === "number" && (
        <>
          <p className="chooser-q">2. What do you want to know?</p>
          <div className="chips" role="group">
            {[
              ["describe", "What my numbers look like"],
              ["correlate", "Whether it goes up and down with another measure"],
              ["groups", "Whether two groups differ"],
              ["regress", "How several things together predict it"],
            ].map(([k, label]) => (
              <button key={k} className="chip" aria-pressed={goal === k} onClick={() => setGoal(k)}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      {rec && (
        <p className="chooser-answer">
          <a href={rec.m.href}>
            <strong>Module {MODULES.indexOf(rec.m) + 1}: {rec.m.title}</strong>
          </a>
          <br />
          {rec.why}
        </p>
      )}
    </div>
  );
}
