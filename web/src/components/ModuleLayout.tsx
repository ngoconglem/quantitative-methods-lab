import type { ReactNode } from "react";
import { MODULES } from "../lib/modules";
import { CutoffTable } from "./Cutoffs";
import type { StepKey } from "../lib/cutoffs";

export function ModuleNav({ current }: { current: string }) {
  return (
    <nav className="chips module-nav" aria-label="Modules">
      {MODULES.map((m, j) => (
        <a key={m.key} className="chip" href={m.href} aria-current={m.key === current ? "page" : undefined} style={{ textDecoration: "none" }}>
          <span className="step-no">{j + 1}</span> {m.title}
        </a>
      ))}
    </nav>
  );
}

export function ModuleLayout({ moduleKey, children, cutoffs }: { moduleKey: string; children: ReactNode; cutoffs?: StepKey }) {
  const i = MODULES.findIndex((m) => m.key === moduleKey);
  const mod = MODULES[i];
  const prev = MODULES[i - 1];
  const next = MODULES[i + 1];
  return (
    <article className="module">
      <ModuleNav current={moduleKey} />
      <p className="module-kicker">Module {i + 1} of {MODULES.length}</p>
      <h1>{mod.title}</h1>
      <p className="lede">{mod.question}</p>
      {children}
      {cutoffs && (
        <details className="fold">
          <summary>Cut-off values used in this module, with sources</summary>
          <CutoffTable step={cutoffs} title="" />
        </details>
      )}
      <nav className="module-pager" aria-label="Previous and next module">
        {prev ? <a href={prev.href}>Previous: {prev.title}</a> : <span />}
        {next ? <a href={next.href}>Next: {next.title}</a> : <span />}
      </nav>
    </article>
  );
}

export function Section({ title, children, id, folded }: { title: string; children: ReactNode; id?: string; folded?: boolean }) {
  if (folded)
    return (
      <section className="module-section" id={id}>
        <details className="fold">
          <summary>{title}</summary>
          {children}
        </details>
      </section>
    );
  return (
    <section className="module-section" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/** The one-paragraph idea at the top of a module: a short statement plus three scannable points. */
export function KeyIdea({ gist, points }: { gist: ReactNode; points: [ReactNode, ReactNode][] }) {
  return (
    <section className="key-idea" aria-label="The key idea">
      <p className="key-gist">{gist}</p>
      <dl>
        {points.map(([k, v], i) => (
          <div key={i}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
