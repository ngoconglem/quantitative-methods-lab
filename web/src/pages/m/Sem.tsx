import { useMemo, useState } from "react";
import { ModuleLayout, Section, KeyIdea } from "../../components/ModuleLayout";
import { CodeTabs, Quiz } from "../../components/plots";
import { Guide, Term } from "../../components/Guide";
import { useDataset, num, f, pFmt, type Dataset } from "../../lib/datasets";
import { fitSem, indirect, type SemSpec } from "../../lib/sem";

/** Observed: contact, prof, KN, AT, SK, AW, wtc; latent: ICC. */
const VARS = ["contact", "prof", "KN", "AT", "SK", "AW", "wtc", "ICC"];
const [CON, PROF, KN, AT, SK, AW, WTC, ICC] = VARS.map((_, i) => i);

export function semData(d: Dataset) {
  const mean = (keys: string[], i: number) => keys.reduce((s, k) => s + (k === "AT2" ? 6 - num(d, k)[i] : num(d, k)[i]), 0) / keys.length;
  const ks = (p: string, n: number[]) => n.map((j) => `${p}${j}`);
  return num(d, "id").map((_, i) => [
    Math.log1p(num(d, "contact_hours")[i]),
    num(d, "proficiency")[i] / 10,
    mean(ks("KN", [1, 2, 3, 4, 5]), i),
    mean(ks("AT", [1, 2, 3, 4]), i),
    mean(ks("SK", [1, 2, 3, 4, 5]), i),
    mean(ks("AW", [1, 2, 3, 4, 5]), i),
    num(d, "wtc")[i],
  ]);
}

export function semSpec(direct: boolean): SemSpec {
  const P = (kind: "A" | "S", row: number, col: number, label: string) => ({ kind, row, col, label });
  const params = [
    P("A", AT, ICC, "ICC → Attitudes"),
    P("A", SK, ICC, "ICC → Skills"),
    P("A", AW, ICC, "ICC → Awareness"),
    P("A", ICC, CON, "a: Contact → ICC"),
    P("A", ICC, PROF, "Proficiency → ICC"),
    P("A", WTC, ICC, "b: ICC → WTC"),
    ...(direct ? [P("A", WTC, CON, "c′: Contact → WTC")] : []),
    P("A", WTC, PROF, "Proficiency → WTC"),
    P("S", CON, CON, "var(Contact)"),
    P("S", PROF, PROF, "var(Proficiency)"),
    P("S", CON, PROF, "cov(Contact, Proficiency)"),
    P("S", ICC, ICC, "ICC disturbance"),
    P("S", WTC, WTC, "WTC residual"),
    P("S", KN, KN, "KN residual"),
    P("S", AT, AT, "AT residual"),
    P("S", SK, SK, "SK residual"),
    P("S", AW, AW, "AW residual"),
  ];
  return { vars: VARS, nObserved: 7, params, fixed: [{ kind: "A", row: KN, col: ICC, value: 1 }] };
}

export default function Sem() {
  const { data, error } = useDataset("intercultural");
  const [direct, setDirect] = useState(true);
  const res = useMemo(() => {
    if (!data) return null;
    const spec = semSpec(direct);
    const fit = fitSem(semData(data), spec);
    const idx = (label: string) => spec.params.findIndex((p) => p.label.startsWith(label));
    const a = idx("a:"), b = idx("b:"), c = idx("c′:");
    return { spec, fit, a, b, c, ind: indirect(fit, a, b) };
  }, [data, direct]);

  const S = (label: string) => (res ? res.fit.std[res.spec.params.findIndex((p) => p.label.startsWith(label))] : 0);
  const Pv = (label: string) => (res ? res.fit.pval[res.spec.params.findIndex((p) => p.label.startsWith(label))] : 1);

  return (
    <ModuleLayout moduleKey="sem" cutoffs="sem">
      <KeyIdea
        gist="Structural equation modelling (SEM) joins two things in one model: a measurement part (factors measured by several indicators, as in CFA) and a structural part (regressions between variables)."
        points={[
          ["Why use it", "To test a theory of how several variables influence each other, while allowing for measurement error."],
          ["Mediation", "Does X affect Y through M? The indirect effect is the a path times the b path."],
          ["Fit", <>The same <Term id="cfa">CFA</Term> fit indices tell you whether the whole model is consistent with the data.</>],
        ]}
      />

      <Section title="The question">
        <p>
          Does intercultural contact raise students' willingness to communicate in English <em>because</em> it builds intercultural competence?{" "}
          <span className="sim-tag">Simulated data</span>
        </p>
        <div className="legend-row" style={{ marginBottom: 8 }}>
          <span>Oval = latent factor (not measured directly)</span>
          <span>Rectangle = measured variable</span>
          <span>Arrow = effect, with standardised coefficient</span>
        </div>
        {error && <p className="error">{error}</p>}
        {res && <SemDiagram S={S} Pv={Pv} direct={direct} />}
        <label className="check">
          <input type="checkbox" checked={direct} onChange={(e) => setDirect(e.target.checked)} /> Include the direct path from contact to
          willingness to communicate (c′)
        </label>
      </Section>

      {res && (
        <Section title="Results">
          <div className="stat-grid">
            <div className="stat">
              <div className="value">{f(res.ind.std, 2, true)}</div>
              <div className="label">
                Indirect effect (standardised), 95% CI [{f(res.ind.lo, 3, true)}, {f(res.ind.hi, 3, true)}] in raw units
              </div>
            </div>
            <div className="stat">
              <div className="value">{f(res.fit.cfi, 3, true)}</div>
              <div className="label">CFI (≥ .95 is good)</div>
            </div>
            <div className="stat">
              <div className="value">{f(res.fit.rmsea, 3, true)}</div>
              <div className="label">RMSEA (≤ .06 is good)</div>
            </div>
            <div className="stat">
              <div className="value">{f(res.fit.srmr, 3, true)}</div>
              <div className="label">SRMR (≤ .08 is good)</div>
            </div>
          </div>
          <p className="verdict">
            {res.ind.lo > 0 ? (
              <>
                Contact is linked to higher intercultural competence, which in turn goes with greater willingness to communicate: the indirect
                effect's confidence interval excludes zero.{" "}
                {direct && res.c >= 0 && (res.fit.pval[res.c] < 0.05 ? "Contact also has a direct link (partial mediation)." : "Once competence is in the model, contact has no clear direct link (full mediation).")}
              </>
            ) : (
              "The indirect effect's confidence interval includes zero: no clear evidence of mediation."
            )}{" "}
            {!direct && `Without the direct path the model fits ${res.fit.cfi >= 0.95 ? "about as well" : "worse"}: compare CFI and RMSEA with the box ticked.`}
          </p>
          <Guide title="All estimates">
            <div className="table-wrap">
              <table className="mini">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th className="num">Estimate</th>
                    <th className="num">SE</th>
                    <th className="num">Standardised</th>
                    <th className="num">p</th>
                  </tr>
                </thead>
                <tbody>
                  {res.spec.params.map((p, k) => (
                    <tr key={p.label}>
                      <td>{p.label}</td>
                      <td className="num">{f(res.fit.est[k], 3)}</td>
                      <td className="num">{f(res.fit.se[k], 3)}</td>
                      <td className="num">{f(res.fit.std[k], 2, true)}</td>
                      <td className="num">{pFmt(res.fit.pval[k]).replace("p ", "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">
              Contact is entered as log(1 + weekly hours), proficiency in tens of test points, and each competence dimension as the mean of its
              items (AT5 dropped, AT2 reverse-scored). The first indicator (knowledge) fixes the factor's scale.
            </p>
          </Guide>
        </Section>
      )}

      <Section title="Check your understanding">
        <Quiz
          items={[
            {
              q: "a = .40 (contact → competence) and b = .50 (competence → willingness), standardised. The indirect effect is…",
              options: [".90", ".20", ".10"],
              answer: 1,
              why: "Multiply the two paths: .40 × .50 = .20.",
            },
            {
              q: "Why put competence in as a latent factor rather than a single average score?",
              options: ["It is quicker", "It separates the construct from measurement error, so paths are not weakened by unreliable scores", "Averages cannot be used in regression"],
              answer: 1,
              why: "Measurement error in a predictor shrinks its coefficient. A latent factor models that error explicitly.",
            },
            {
              q: "The model fits well. Has it proved that contact causes competence?",
              options: ["Yes", "No: good fit means the data are consistent with the model, not that the causal order is right", "Only if p < .05"],
              answer: 1,
              why: "With cross-sectional survey data, other causal orders can fit equally well. Causal claims need design: time order, experiments or strong theory.",
            },
          ]}
        />
      </Section>

      <Section title="Reporting it">
        {res && (
          <p className="report-box">
            A structural equation model (maximum likelihood) tested whether intercultural competence, a latent factor with four indicators,
            mediated the link between intercultural contact and willingness to communicate, with English proficiency as a second predictor of
            both. The model fit{" "}
            {res.fit.cfi >= 0.95 && res.fit.rmsea <= 0.06 ? "well" : "acceptably"}, χ²({res.fit.df}) = {f(res.fit.chi2, 2)}, CFI ={" "}
            {f(res.fit.cfi, 3, true)}, RMSEA = {f(res.fit.rmsea, 3, true)}, SRMR = {f(res.fit.srmr, 3, true)}. Contact predicted competence (β ={" "}
            {f(S("a:"), 2, true)}), which predicted willingness to communicate (β = {f(S("b:"), 2, true)}); the standardised indirect effect was{" "}
            {f(res.ind.std, 2, true)} (delta-method 95% CI in raw units [{f(res.ind.lo, 3, true)}, {f(res.ind.hi, 3, true)}]).
          </p>
        )}
        <p className="small muted">
          For published work, report a bootstrap confidence interval for the indirect effect (lavaan: <code>se = "bootstrap"</code>); the
          delta-method interval here is a quick approximation.
        </p>
      </Section>

      <Section title="Do it in R or Python" folded>
        <CodeTabs
          r={`library(lavaan)
d <- read.csv("intercultural_simulated.csv")   # in the repository's data folder
d$AT2 <- 6 - d$AT2
d$KN <- rowMeans(d[, paste0("KN", 1:5)]); d$AT <- rowMeans(d[, paste0("AT", 1:4)])
d$SK <- rowMeans(d[, paste0("SK", 1:5)]); d$AW <- rowMeans(d[, paste0("AW", 1:5)])
d$contact <- log1p(d$contact_hours); d$prof <- d$proficiency / 10
model <- '
  ICC =~ KN + AT + SK + AW
  ICC ~ a * contact + prof
  wtc ~ b * ICC + c * contact + prof
  indirect := a * b
'
fit <- sem(model, data = d, se = "bootstrap", bootstrap = 2000)
summary(fit, fit.measures = TRUE, standardized = TRUE)
parameterEstimates(fit, boot.ci.type = "perc")`}
          python={`import numpy as np, pandas as pd, semopy
d = pd.read_csv("https://raw.githubusercontent.com/ngoconglem/quantitative-methods-lab/main/data/intercultural_simulated.csv")
d["AT2"] = 6 - d["AT2"]
for k, items in {"KN": range(1, 6), "AT": range(1, 5), "SK": range(1, 6), "AW": range(1, 6)}.items():
    d[k] = d[[f"{k}{i}" for i in items]].mean(axis=1)
d["contact"] = np.log1p(d.contact_hours); d["prof"] = d.proficiency / 10
m = semopy.Model("""ICC =~ KN + AT + SK + AW
ICC ~ contact + prof
wtc ~ ICC + contact + prof""")
m.fit(d, obj="MLW")
print(semopy.calc_stats(m).T); print(m.inspect(std_est=True))`}
        />
      </Section>
    </ModuleLayout>
  );
}

function SemDiagram({ S, Pv, direct }: { S: (l: string) => number; Pv: (l: string) => number; direct: boolean }) {
  const W = 720, H = 330;
  const box = (x: number, y: number, w: number, label: string, sub?: string) => (
    <g>
      <rect x={x} y={y} width={w} height={44} rx={6} fill="#fff" stroke="#9fb0bd" />
      <text x={x + w / 2} y={y + (sub ? 19 : 27)} fontSize={13} fontWeight={600} textAnchor="middle" fill="#1c2b3a">{label}</text>
      {sub && <text x={x + w / 2} y={y + 35} fontSize={10.5} textAnchor="middle" fill="#6b7a87">{sub}</text>}
    </g>
  );
  const coef = (x: number, y: number, label: string) => {
    const v = S(label);
    const sig = Pv(label) < 0.05;
    return (
      <g>
        <rect x={x - 26} y={y - 13} width={52} height={22} rx={11} fill={sig ? "#e7f1fb" : "#f1f3f4"} stroke={sig ? "#2a78d6" : "#c9d3da"} />
        <text x={x} y={y + 3} fontSize={12} fontWeight={700} textAnchor="middle" fill={sig ? "#163f73" : "#6b7a87"}>{f(v, 2, true)}</text>
      </g>
    );
  };
  const arrow = "url(#arr)";
  return (
    <figure className="chart-fig">
      <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label="Structural equation model diagram with standardised coefficients" style={{ maxWidth: 760 }}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5f6f7c" />
          </marker>
        </defs>
        {/* indicators */}
        {["KN", "AT", "SK", "AW"].map((k, i) => (
          <g key={k}>
            {box(232 + i * 66, 8, 58, k)}
            <line x1={360} y1={150} x2={261 + i * 66} y2={54} stroke="#8796a3" strokeWidth={1.5} markerEnd={arrow} />
          </g>
        ))}
        {/* latent */}
        <ellipse cx={360} cy={175} rx={92} ry={34} fill="#a34a4a" fillOpacity={0.1} stroke="#a34a4a" strokeWidth={2} />
        <text x={360} y={172} fontSize={13} fontWeight={700} textAnchor="middle" fill="#a34a4a">Intercultural</text>
        <text x={360} y={188} fontSize={13} fontWeight={700} textAnchor="middle" fill="#a34a4a">competence</text>
        {/* exogenous */}
        {box(14, 153, 150, "Contact", "weekly hours (log)")}
        {box(14, 262, 150, "Proficiency", "English test")}
        {box(556, 153, 150, "Willingness", "to communicate")}
        <line x1={164} y1={175} x2={266} y2={175} stroke="#5f6f7c" strokeWidth={2} markerEnd={arrow} />
        <line x1={452} y1={175} x2={554} y2={175} stroke="#5f6f7c" strokeWidth={2} markerEnd={arrow} />
        {direct && <path d="M 120 153 C 200 95, 520 95, 600 151" fill="none" stroke="#5f6f7c" strokeWidth={1.5} strokeDasharray="5 4" markerEnd={arrow} />}
        <line x1={164} y1={284} x2={560} y2={199} stroke="#5f6f7c" strokeWidth={1.5} markerEnd={arrow} />
        <line x1={150} y1={262} x2={300} y2={203} stroke="#5f6f7c" strokeWidth={1.5} markerEnd={arrow} />
        {coef(232, 238, "Proficiency → ICC")}
        <path d="M 30 197 C 0 220, 0 240, 30 262" fill="none" stroke="#b4c0c9" strokeWidth={1.5} markerStart={arrow} markerEnd={arrow} />
        {coef(215, 175, "a:")}
        {coef(503, 175, "b:")}
        {direct && coef(360, 108, "c′:")}
        {coef(430, 230, "Proficiency → WTC")}
        <text x={215} y={203} fontSize={11} textAnchor="middle" fill="#6b7a87">a</text>
        <text x={503} y={203} fontSize={11} textAnchor="middle" fill="#6b7a87">b</text>
        {direct && <text x={604} y={112} fontSize={11} textAnchor="middle" fill="#6b7a87">c′ (direct)</text>}
      </svg>
      <figcaption className="small muted">
        Blue labels are statistically significant (p &lt; .05); grey are not. The indirect effect is a × b.
      </figcaption>
    </figure>
  );
}
