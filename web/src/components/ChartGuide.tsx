const B = "#2a78d6";
const O = "#eb6834";
const G = "#c9d3da";

function Icon({ kind }: { kind: string }) {
  const box = (children: React.ReactNode) => (
    <svg viewBox="0 0 64 40" width={64} height={40} aria-hidden="true">
      <line x1={4} y1={36} x2={60} y2={36} stroke={G} />
      {children}
    </svg>
  );
  switch (kind) {
    case "hist":
      return box([6, 14, 24, 30, 22, 14, 9, 5, 3].map((h, i) => <rect key={i} x={6 + i * 6} y={36 - h} width={5} height={h} rx={1} fill={B} />));
    case "box":
      return box(
        <>
          <line x1={10} y1={20} x2={20} y2={20} stroke={B} strokeWidth={2} />
          <rect x={20} y={12} width={18} height={16} rx={2} fill="none" stroke={B} strokeWidth={2} />
          <line x1={28} y1={12} x2={28} y2={28} stroke={B} strokeWidth={2} />
          <line x1={38} y1={20} x2={54} y2={20} stroke={B} strokeWidth={2} />
          <circle cx={58} cy={20} r={2} fill={B} />
        </>,
      );
    case "dots":
      return box(
        <>
          {[0, 1, 2].map((g) =>
            [0, 1, 2, 3, 4].map((k) => <circle key={`${g}${k}`} cx={14 + g * 18 + (k % 2 ? 3 : -3)} cy={30 - g * 6 - k * 3} r={1.8} fill={B} fillOpacity={0.5} />),
          )}
          {[0, 1, 2].map((g) => (
            <line key={g} x1={9 + g * 18} x2={19 + g * 18} y1={24 - g * 6} y2={24 - g * 6} stroke={O} strokeWidth={2.5} />
          ))}
        </>,
      );
    case "scatter":
      return box(
        <>
          {[[8, 30], [14, 28], [18, 24], [24, 25], [28, 20], [34, 19], [38, 15], [44, 14], [50, 10], [56, 8], [22, 30], [40, 22]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2} fill={B} />
          ))}
          <line x1={6} y1={32} x2={58} y2={7} stroke={O} strokeWidth={1.5} />
        </>,
      );
    case "bars":
      return box([22, 30, 12, 18].map((h, i) => <rect key={i} x={8 + i * 13} y={36 - h} width={10} height={h} rx={1.5} fill={B} />));
    case "stacked":
      return box(
        [0, 1, 2].map((r) => {
          const a = [26, 18, 34][r];
          return (
            <g key={r}>
              <rect x={6} y={6 + r * 10} width={a} height={7} fill={B} />
              <rect x={6 + a + 1} y={6 + r * 10} width={51 - a} height={7} fill={O} />
            </g>
          );
        }),
      );
    case "likert":
      return box(
        [0, 1, 2].map((r) => {
          const neg = [10, 16, 6][r];
          const pos = [22, 14, 26][r];
          return (
            <g key={r}>
              <rect x={32 - neg} y={6 + r * 10} width={neg} height={7} fill={O} />
              <rect x={32} y={6 + r * 10} width={pos} height={7} fill={B} />
            </g>
          );
        }),
      );
    case "line":
      return box(
        <>
          <polyline points="6,30 18,26 30,20 42,18 56,10" fill="none" stroke={B} strokeWidth={2} />
          <polyline points="6,32 18,30 30,29 42,26 56,24" fill="none" stroke={O} strokeWidth={2} />
        </>,
      );
    default:
      return null;
  }
}

const ROWS: [string, string, string, string][] = [
  ["hist", "One number", "Histogram", "Essay length; reaction time"],
  ["box", "One number, compact", "Box plot", "Test scores, with outliers marked"],
  ["dots", "A number by group", "Dots with means", "Willingness to communicate by time abroad"],
  ["scatter", "Two numbers", "Scatterplot", "Contact hours and intercultural competence"],
  ["bars", "Categories", "Bar chart of counts or %", "Students' first languages"],
  ["stacked", "Categories by group", "100% stacked bars", "NP vs PP dative, spoken vs written"],
  ["likert", "Agree–disagree items", "Diverging stacked bars", "Questionnaire items, disagree left, agree right"],
  ["line", "Change over time", "Line chart", "Scores at pre-test, post-test, delayed test"],
];

export function ChartGuide() {
  return (
    <div className="table-wrap">
      <table className="chart-guide">
        <thead>
          <tr>
            <th>Your data</th>
            <th>Chart</th>
            <th aria-label="Picture" />
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([k, data, chart, ex]) => (
            <tr key={k}>
              <td>{data}</td>
              <td>
                <strong>{chart}</strong>
              </td>
              <td>
                <Icon kind={k} />
              </td>
              <td className="small">{ex}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
