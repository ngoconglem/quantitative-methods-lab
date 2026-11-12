import { CUTOFFS, REFS, cite, type StepKey } from "../lib/cutoffs";

/** The cut-offs used in one step, with the reason and source for each. Always visible. */
export function CutoffTable({ step, title = "Cut-off values used in this step" }: { step?: StepKey; title?: string }) {
  const rows = step ? CUTOFFS.filter((c) => c.step === step) : CUTOFFS;
  return (
    <section className="cutoffs" aria-label={title || "Cut-off values"}>
      {title && <h3>{title}</h3>}
      <p className="small muted">
        Cut-offs are conventions that help you decide what to look at, not rules that decide for you. Each one is listed with its reason and
        source; full references are on the <a href="#learn/cutoffs">Learn</a> page.
      </p>
      <div className="table-wrap">
        <table className="cutoff-table">
          <thead>
            <tr>
              <th scope="col">What is checked</th>
              <th scope="col">Cut-off used</th>
              <th scope="col">Why this value</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <th scope="row">{c.check}</th>
                <td>{c.value}</td>
                <td>{c.why}</td>
                <td className="nowrap-ish">{c.refs.length ? cite(c.refs) : <em>Lab heuristic, no published standard</em>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ReferenceList({ include = [] }: { include?: string[] }) {
  const used = new Set([...CUTOFFS.flatMap((c) => c.refs), ...include]);
  const refs = Object.entries(REFS)
    .filter(([id]) => used.has(id))
    .sort((a, b) => a[1].full.localeCompare(b[1].full));
  return (
    <ul className="references">
      {refs.map(([id, r]) => (
        <li key={id}>
          {r.full}{" "}
          {r.url && (
            <a href={r.url} target="_blank" rel="noreferrer">
              {r.url.replace("https://", "")}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
