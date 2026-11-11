import { useEffect, useRef, useState, type ReactNode } from "react";
import { apa, fmt } from "../lib/data";

export function useTooltip() {
  const [tip, setTip] = useState<{ x: number; y: number; content: ReactNode } | null>(null);
  const show = (e: React.MouseEvent | React.FocusEvent, content: ReactNode) => {
    const pos = "clientX" in e ? { x: e.clientX, y: e.clientY } : (() => {
      const b = (e.currentTarget as Element).getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    })();
    setTip({ ...pos, content });
  };
  const node = tip ? (
    <div className="tooltip" role="status" style={{ left: Math.min(tip.x + 14, window.innerWidth - 300), top: tip.y + 16 }}>
      {tip.content}
    </div>
  ) : null;
  return { show, hide: () => setTip(null), node };
}

function useWidth(fallback = 640) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

// ---------------------------------------------------------------- scree plot with parallel analysis

export function ScreePlot({ observed, random, suggested }: { observed: number[]; random?: number[]; suggested?: number }) {
  const { ref, w: W } = useWidth();
  const tip = useTooltip();
  const H = 260;
  const padL = 40, padR = 16, padT = 14, padB = 34;
  const n = Math.min(observed.length, 15);
  const maxV = Math.max(...observed.slice(0, n), ...(random?.slice(0, n) ?? []), 1) * 1.08;
  const x = (i: number) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / maxV) * (H - padT - padB);
  const ticks = Array.from({ length: Math.floor(maxV) + 1 }, (_, i) => i).filter((t) => t <= maxV && (maxV < 8 || t % 2 === 0));
  const line = (vals: number[]) => vals.slice(0, n).map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <svg width={W} height={H} style={{ display: "block", maxWidth: "100%" }} role="img" aria-label="Scree plot of observed eigenvalues against parallel-analysis eigenvalues">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e4e9ec" />
            <text x={padL - 8} y={y(t) + 4} fontSize={12} fill="#6b7a87" textAnchor="end">{t}</text>
          </g>
        ))}
        {Array.from({ length: n }, (_, i) => (
          <text key={i} x={x(i)} y={H - 12} fontSize={12} fill="#6b7a87" textAnchor="middle">{i + 1}</text>
        ))}
        <text x={(W + padL) / 2} y={H} fontSize={11.5} fill="#6b7a87" textAnchor="middle">Factor number</text>
        {suggested !== undefined && suggested > 0 && (
          <rect x={padL - 8} y={padT} width={x(suggested - 1) - padL + 16} height={H - padT - padB} fill="#2a78d6" opacity={0.06} />
        )}
        {random && <path d={line(random)} fill="none" stroke="#eb6834" strokeWidth={2} strokeDasharray="5 4" />}
        <path d={line(observed)} fill="none" stroke="#2a78d6" strokeWidth={2} />
        {observed.slice(0, n).map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={5}
            fill="#2a78d6"
            stroke="#fff"
            strokeWidth={2}
            tabIndex={0}
            onMouseMove={(e) =>
              tip.show(e, <>Factor {i + 1}<br />Observed eigenvalue {fmt(v)}{random && <><br />Random data (95th percentile) {fmt(random[i])}</>}</>)
            }
            onFocus={(e) => tip.show(e, `Factor ${i + 1}: observed ${fmt(v)}${random ? `, random ${fmt(random[i])}` : ""}`)}
            onMouseLeave={tip.hide}
            onBlur={tip.hide}
          />
        ))}
        {random?.slice(0, n).map((v, i) => <circle key={`r${i}`} cx={x(i)} cy={y(v)} r={3.5} fill="#eb6834" stroke="#fff" strokeWidth={1.5} pointerEvents="none" />)}
      </svg>
      <div className="legend small" style={{ marginTop: 4 }}>
        <span><span className="swatch" style={{ background: "#2a78d6" }} /> Your data</span>
        {random && <span><span className="swatch" style={{ background: "#eb6834" }} /> Random data, 95th percentile (parallel analysis)</span>}
        {suggested !== undefined && suggested > 0 && <span className="muted">Shaded: factors whose eigenvalue beats random data ({suggested})</span>}
      </div>
      {tip.node}
    </div>
  );
}

// ---------------------------------------------------------------- correlation heatmap (diverging)

const NEG = ["#a51f1f", "#d04a46", "#e98b7f", "#f6c6bd"];
const POS = ["#cde2fb", "#86b6ef", "#3987e5", "#1c5cab"];
const MID = "#f0efec";

export function corrColor(r: number) {
  const a = Math.abs(r);
  if (a < 0.1) return MID;
  const k = a < 0.2 ? 0 : a < 0.35 ? 1 : a < 0.5 ? 2 : 3;
  return r > 0 ? POS[k] : NEG[3 - k];
}

export function CorrHeatmap({ labels, R }: { labels: string[]; R: number[][] }) {
  const tip = useTooltip();
  const p = labels.length;
  const cell = Math.max(14, Math.min(30, 560 / p));
  const pad = 52;
  const size = pad + p * cell;
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${size + 2} ${size + 2}`} width="100%" style={{ maxWidth: Math.min(680, size * 1.4) }} role="img" aria-label="Inter-item correlation heatmap">
        {labels.map((l, i) => (
          <g key={l}>
            <text x={pad - 6} y={pad + i * cell + cell / 2 + 4} fontSize={Math.min(11, cell * 0.55)} textAnchor="end" fill="#475867">{l}</text>
            <text x={pad + i * cell + cell / 2} y={pad - 6} fontSize={Math.min(11, cell * 0.55)} textAnchor="start" fill="#475867" transform={`rotate(-60 ${pad + i * cell + cell / 2} ${pad - 6})`}>{l}</text>
          </g>
        ))}
        {R.map((row, i) =>
          row.map((r, j) => (
            <rect
              key={`${i}-${j}`}
              x={pad + j * cell}
              y={pad + i * cell}
              width={cell - 1}
              height={cell - 1}
              rx={2}
              fill={i === j ? "#ffffff" : corrColor(r)}
              stroke={i === j ? "#d5dde1" : "none"}
              onMouseMove={(e) => i !== j && tip.show(e, <>{labels[i]} × {labels[j]}<br />r = {apa(r)}</>)}
              onMouseLeave={tip.hide}
            />
          )),
        )}
      </svg>
      <div className="legend small" style={{ marginTop: 6 }}>
        <span>Negative</span>
        <span style={{ display: "inline-flex" }}>
          {[...NEG, MID, ...POS].map((c) => (
            <span key={c} style={{ width: 22, height: 10, background: c, display: "inline-block" }} />
          ))}
        </span>
        <span>Positive</span>
        <span className="muted">Bands: |r| below .10, .20, .35, .50, and above</span>
      </div>
      {tip.node}
    </div>
  );
}

// ---------------------------------------------------------------- response distribution mini bars

export function DistBars({ counts, lo }: { counts: number[]; lo: number }) {
  const max = Math.max(...counts, 1);
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const w = 12, gap = 2, h = 26;
  return (
    <svg width={counts.length * (w + gap)} height={h + 12} role="img" aria-label={counts.map((c, i) => `${lo + i}: ${Math.round((100 * c) / total)}%`).join(", ")}>
      {counts.map((c, i) => {
        const bh = (c / max) * h;
        return (
          <g key={i}>
            <title>{`${lo + i}: ${c} (${Math.round((100 * c) / total)}%)`}</title>
            <rect x={i * (w + gap)} y={h - bh} width={w} height={Math.max(bh, 1)} rx={2} fill="#3987e5" />
            <text x={i * (w + gap) + w / 2} y={h + 11} fontSize={9} fill="#6b7a87" textAnchor="middle">{lo + i}</text>
          </g>
        );
      })}
    </svg>
  );
}
