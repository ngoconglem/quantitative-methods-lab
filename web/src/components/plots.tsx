import { useState, type ReactNode } from "react";

export const BLUE = "#2a78d6";
export const ORANGE = "#eb6834";
const INK3 = "#6b7a87";
const GRID = "#e4e9ec";

function nice(lo: number, hi: number, n = 5): number[] {
  const span = hi - lo || 1;
  const step0 = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) ?? step0;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

const fmtTick = (v: number) => (Math.abs(v) >= 1000 ? v.toLocaleString() : Math.abs(v) < 1 && v !== 0 ? v.toFixed(2).replace(/^(-?)0\./, "$1.") : String(+v.toFixed(2)));

/** Histogram with optional mean and median markers. */
export function Histogram({
  edges,
  counts,
  xLabel,
  mean,
  median,
  format = fmtTick,
}: {
  edges: number[];
  counts: number[];
  xLabel: string;
  mean?: number;
  median?: number;
  format?: (v: number) => string;
}) {
  const W = 640;
  const H = 240;
  const m = { l: 48, r: 12, t: 12, b: 44 };
  const lo = edges[0];
  const hi = edges[edges.length - 1];
  const max = Math.max(...counts, 1);
  const x = (v: number) => m.l + ((v - lo) / (hi - lo || 1)) * (W - m.l - m.r);
  const y = (c: number) => H - m.b - (c / max) * (H - m.t - m.b);
  const yt = nice(0, max, 4);
  const xt = nice(lo, hi, 6).filter((v) => v >= lo && v <= hi);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label={`Histogram of ${xLabel}`}>
      {yt.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke={GRID} />
          <text x={m.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={INK3}>
            {t}
          </text>
        </g>
      ))}
      {counts.map((c, i) => (
        <rect key={i} x={x(edges[i]) + 1} y={y(c)} width={Math.max(1, x(edges[i + 1]) - x(edges[i]) - 2)} height={H - m.b - y(c)} fill={BLUE} rx={2}>
          <title>{`${format(edges[i])} to ${format(edges[i + 1])}: ${c}`}</title>
        </rect>
      ))}
      {mean !== undefined && (
        <g>
          <line x1={x(mean)} x2={x(mean)} y1={m.t} y2={H - m.b} stroke={ORANGE} strokeWidth={2} />
          <text x={x(mean) + 4} y={m.t + 10} fontSize={11} fill={ORANGE}>
            mean
          </text>
        </g>
      )}
      {median !== undefined && (
        <g>
          <line x1={x(median)} x2={x(median)} y1={m.t + 16} y2={H - m.b} stroke="#1c2b3a" strokeWidth={2} strokeDasharray="4 3" />
          <text x={x(median) + 4} y={m.t + 26} fontSize={11} fill="#1c2b3a">
            median
          </text>
        </g>
      )}
      <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke={INK3} />
      {xt.map((t) => (
        <text key={t} x={x(t)} y={H - m.b + 16} textAnchor="middle" fontSize={11} fill={INK3}>
          {format(t)}
        </text>
      ))}
      <text x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle" fontSize={12} fill="#475867">
        {xLabel}
      </text>
      <text x={12} y={(m.t + H - m.b) / 2} textAnchor="middle" fontSize={12} fill="#475867" transform={`rotate(-90 12 ${(m.t + H - m.b) / 2})`}>
        Number of cases
      </text>
    </svg>
  );
}

/** Scatter plot of (a sample of) points, with an optional straight line y = a + b·x and a zero line. */
export function Scatter({
  x,
  y,
  xLabel,
  yLabel,
  line,
  zeroLine,
  color,
  labels,
  height = 300,
}: {
  x: number[];
  y: number[];
  xLabel: string;
  yLabel: string;
  line?: { a: number; b: number };
  zeroLine?: boolean;
  color?: (i: number) => string;
  labels?: (i: number) => string;
  height?: number;
}) {
  const W = 640;
  const H = height;
  const m = { l: 56, r: 12, t: 10, b: 44 };
  const pad = (lo: number, hi: number) => [lo - (hi - lo) * 0.03, hi + (hi - lo) * 0.03];
  const [x0, x1] = pad(Math.min(...x), Math.max(...x));
  const [y0, y1] = pad(Math.min(...y), Math.max(...y));
  const sx = (v: number) => m.l + ((v - x0) / (x1 - x0 || 1)) * (W - m.l - m.r);
  const sy = (v: number) => H - m.b - ((v - y0) / (y1 - y0 || 1)) * (H - m.t - m.b);
  const xt = nice(x0, x1, 6).filter((v) => v >= x0 && v <= x1);
  const yt = nice(y0, y1, 5).filter((v) => v >= y0 && v <= y1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label={`Scatter plot of ${yLabel} against ${xLabel}`}>
      {yt.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} stroke={GRID} />
          <text x={m.l - 6} y={sy(t) + 4} textAnchor="end" fontSize={11} fill={INK3}>
            {fmtTick(t)}
          </text>
        </g>
      ))}
      {xt.map((t) => (
        <text key={t} x={sx(t)} y={H - m.b + 16} textAnchor="middle" fontSize={11} fill={INK3}>
          {fmtTick(t)}
        </text>
      ))}
      <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke={INK3} />
      {zeroLine && y0 < 0 && y1 > 0 && <line x1={m.l} x2={W - m.r} y1={sy(0)} y2={sy(0)} stroke="#1c2b3a" strokeDasharray="4 3" />}
      {x.map((v, i) => (
        <circle key={i} cx={sx(v)} cy={sy(y[i])} r={3.2} fill={color ? color(i) : BLUE} fillOpacity={0.45} stroke="#fff" strokeWidth={0.6}>
          {labels && <title>{labels(i)}</title>}
        </circle>
      ))}
      {line && (
        <line
          x1={sx(x0)}
          y1={sy(line.a + line.b * x0)}
          x2={sx(x1)}
          y2={sy(line.a + line.b * x1)}
          stroke={ORANGE}
          strokeWidth={2.5}
          clipPath="none"
        />
      )}
      <text x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle" fontSize={12} fill="#475867">
        {xLabel}
      </text>
      <text x={14} y={(m.t + H - m.b) / 2} textAnchor="middle" fontSize={12} fill="#475867" transform={`rotate(-90 14 ${(m.t + H - m.b) / 2})`}>
        {yLabel}
      </text>
    </svg>
  );
}

/** Means with 95% confidence intervals for a few groups, over a light strip of individual values. */
export function MeansPlot({
  groups,
  unit,
}: {
  groups: { label: string; values: number[]; mean: number; lo: number; hi: number; color: string }[];
  unit: string;
}) {
  const W = 640;
  const rowH = 84;
  const H = groups.length * rowH + 40;
  const m = { l: 16, r: 20 };
  const all = groups.flatMap((g) => g.values);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const sx = (v: number) => m.l + ((v - lo) / (hi - lo || 1)) * (W - m.l - m.r);
  const xt = nice(lo, hi, 6).filter((v) => v >= lo && v <= hi);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label="Group means with 95% confidence intervals">
      {xt.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={6} y2={H - 30} stroke={GRID} />
          <text x={sx(t)} y={H - 14} textAnchor="middle" fontSize={11} fill={INK3}>
            {fmtTick(t)}
          </text>
        </g>
      ))}
      {groups.map((g, gi) => {
        const cy = 30 + gi * rowH + rowH / 2;
        return (
          <g key={g.label}>
            <text x={m.l} y={cy - 22} textAnchor="start" fontSize={13} fontWeight={600} fill="#1c2b3a">
              {g.label}
            </text>
            {g.values.map((v, i) => (
              <circle key={i} cx={sx(v)} cy={cy + ((i * 7919) % 23) - 11} r={2.2} fill={g.color} fillOpacity={0.18} />
            ))}
            <line x1={sx(g.lo)} x2={sx(g.hi)} y1={cy} y2={cy} stroke="#1c2b3a" strokeWidth={3} />
            <circle cx={sx(g.mean)} cy={cy} r={6} fill={g.color} stroke="#fff" strokeWidth={2}>
              <title>{`${g.label}: mean ${fmtTick(g.mean)} ${unit}, 95% CI ${fmtTick(g.lo)} to ${fmtTick(g.hi)}`}</title>
            </circle>
          </g>
        );
      })}
      <text x={(m.l + W - m.r) / 2} y={H} textAnchor="middle" fontSize={12} fill="#475867">
        {unit}
      </text>
    </svg>
  );
}

/** 100% stacked bars: for each row, the share of each outcome. */
export function ShareBars({ rows, outcomes }: { rows: { label: string; counts: number[] }[]; outcomes: { label: string; color: string }[] }) {
  return (
    <div className="share-bars">
      <div className="share-legend">
        {outcomes.map((o) => (
          <span key={o.label}>
            <span className="swatch" style={{ background: o.color }} /> {o.label}
          </span>
        ))}
      </div>
      {rows.map((r) => {
        const total = r.counts.reduce((a, b) => a + b, 0) || 1;
        return (
          <div key={r.label} className="share-row">
            <span className="share-label">
              {r.label} <span className="muted small">(n = {total.toLocaleString()})</span>
            </span>
            <span className="share-track">
              {r.counts.map((c, i) => (
                <span key={i} style={{ width: `${(100 * c) / total}%`, background: outcomes[i].color }} title={`${outcomes[i].label}: ${c} (${Math.round((100 * c) / total)}%)`}>
                  {(100 * c) / total >= 9 ? `${Math.round((100 * c) / total)}%` : ""}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** A short multiple-choice check with immediate feedback. */
export function Quiz({ items }: { items: { q: ReactNode; options: string[]; answer: number; why: ReactNode }[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(items.map(() => null));
  return (
    <ol className="quiz">
      {items.map((it, i) => (
        <li key={i}>
          <p className="quiz-q">{it.q}</p>
          <div className="quiz-options" role="group">
            {it.options.map((o, j) => {
              const chosen = picked[i] === j;
              const state = picked[i] === null ? undefined : j === it.answer ? "right" : chosen ? "wrong" : undefined;
              return (
                <button
                  key={j}
                  className={`chip quiz-option ${state ?? ""}`}
                  aria-pressed={chosen}
                  onClick={() => setPicked(picked.map((p, k) => (k === i ? j : p)))}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked[i] !== null && (
            <p className="quiz-why" role="status">
              <strong>{picked[i] === it.answer ? "Yes." : "Not quite."}</strong> {it.why}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** R and Python versions of the same analysis. */
export function CodeTabs({ r, python }: { r: string; python: string }) {
  const [tab, setTab] = useState<"r" | "py">("r");
  const [copied, setCopied] = useState(false);
  const code = tab === "r" ? r : python;
  return (
    <div className="code-tabs">
      <div className="chips" role="tablist">
        <button role="tab" className="chip" aria-selected={tab === "r"} aria-pressed={tab === "r"} onClick={() => setTab("r")}>
          R
        </button>
        <button role="tab" className="chip" aria-selected={tab === "py"} aria-pressed={tab === "py"} onClick={() => setTab("py")}>
          Python
        </button>
        <button
          className="quiet"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <pre className="code">{code}</pre>
    </div>
  );
}
