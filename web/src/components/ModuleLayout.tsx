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
      {cutoffs && <CutoffTable step={cutoffs} title="Cut-off values and conventions used in this module" />}
      <nav className="module-pager" aria-label="Previous and next module">
        {prev ? <a href={prev.href}>Previous: {prev.title}</a> : <span />}
        {next ? <a href={next.href}>Next: {next.title}</a> : <span />}
      </nav>
    </article>
  );
}

export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className="module-section" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
