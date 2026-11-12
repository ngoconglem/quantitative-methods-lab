/** Annotated picture of a correctly laid-out response file, plus common mistakes. */

const COLS = ["id", "SE1", "SE2", "SE3", "CE1", "CE4"];
const ROWS: (string | null)[][] = [
  ["p001", "4", "5", "4", "2", "4"],
  ["p002", "3", "3", null, "4", "2"],
  ["p003", "5", "4", "5", "3", "1"],
  ["p004", "2", "2", "3", "4", "5"],
  ["p005", "4", "4", "4", "1", "2"],
];

const GUTTER = 44;
const CW = 92;
const RH = 34;
const TOP = 30; // column-letter row

function Marker({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g aria-hidden="true">
      <circle cx={x} cy={y} r={12} fill="#1d4f91" />
      <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff">
        {n}
      </text>
    </g>
  );
}

export function CsvFigure() {
  const width = GUTTER + CW * (COLS.length + 1);
  const height = TOP + RH * (ROWS.length + 1) + 14;
  const cx = (c: number) => GUTTER + CW * c;
  const ry = (r: number) => TOP + RH * r;
  return (
    <figure className="csv-figure">
      <div className="table-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="csvfig-title csvfig-desc" style={{ width: "100%", height: "auto" }}>
        <title id="csvfig-title">Example of a response file laid out correctly</title>
        <desc id="csvfig-desc">
          A spreadsheet. Row 1 holds the column names id, SE1, SE2, SE3, CE1 and CE4. Each further row is one respondent, with numeric answers
          from 1 to 5. One cell, respondent p002's answer to SE3, is blank because the item was skipped.
        </desc>
        {/* column letters */}
        {[...COLS, "…"].map((_, c) => (
          <g key={`L${c}`}>
            <rect x={cx(c)} y={0} width={CW} height={TOP} fill="#eceff3" stroke="#c9d0d8" />
            <text x={cx(c) + CW / 2} y={20} textAnchor="middle" fontSize={13} fill="#5b6672">
              {String.fromCharCode(65 + c)}
            </text>
          </g>
        ))}
        <rect x={0} y={0} width={GUTTER} height={TOP} fill="#eceff3" stroke="#c9d0d8" />
        {/* row numbers */}
        {Array.from({ length: ROWS.length + 1 }, (_, r) => (
          <g key={`N${r}`}>
            <rect x={0} y={ry(r)} width={GUTTER} height={RH} fill="#eceff3" stroke="#c9d0d8" />
            <text x={GUTTER / 2} y={ry(r) + 22} textAnchor="middle" fontSize={13} fill="#5b6672">
              {r + 1}
            </text>
          </g>
        ))}
        {/* header row */}
        {[...COLS, "…"].map((h, c) => (
          <g key={`H${c}`}>
            <rect x={cx(c)} y={ry(0)} width={CW} height={RH} fill={c === 0 ? "#f4f5f7" : "#e7f1fb"} stroke="#c9d0d8" />
            <text x={cx(c) + 10} y={ry(0) + 22} fontSize={14} fontWeight={700} fill={c === 0 ? "#5b6672" : "#14324f"}>
              {h}
            </text>
          </g>
        ))}
        {/* data rows */}
        {ROWS.map((row, r) =>
          [...row, "…"].map((v, c) => {
            const blank = v === null;
            return (
              <g key={`D${r}-${c}`}>
                <rect
                  x={cx(c)}
                  y={ry(r + 1)}
                  width={CW}
                  height={RH}
                  fill={blank ? "#f9eeda" : c === 0 ? "#f4f5f7" : "#fff"}
                  stroke={blank ? "#c98a1b" : "#c9d0d8"}
                  strokeWidth={blank ? 2 : 1}
                />
                <text
                  x={c === 0 ? cx(c) + 10 : cx(c) + CW - 12}
                  y={ry(r + 1) + 22}
                  textAnchor={c === 0 ? "start" : "end"}
                  fontSize={14}
                  fill={c === 0 ? "#5b6672" : "#1c2b3a"}
                  fontFamily="inherit"
                >
                  {v ?? ""}
                </text>
              </g>
            );
          }),
        )}
        {/* row bracket for respondents */}
        <Marker x={cx(1) + CW - 18} y={ry(0) + RH / 2} n={1} />
        <Marker x={cx(6) + 22} y={ry(3) + RH / 2} n={2} />
        <Marker x={cx(3) + CW / 2} y={ry(2) + RH / 2} n={3} />
        <Marker x={cx(0) + CW - 14} y={ry(4) + RH / 2} n={4} />
        <Marker x={cx(5) + 18} y={ry(5) + RH / 2} n={5} />
      </svg>
      </div>
      <figcaption>
        <ol className="figure-key">
          <li>
            <span>
            <strong>Row 1 holds the item names</strong>, one per column, short and without spaces. Give items in the same subscale the same
            letters (SE1, SE2… for self-efficacy; CE1, CE2… for critical evaluation) and the lab will group them for you.
            </span>
          </li>
          <li>
            <span>
            <strong>Every other row is one person.</strong> Do not add rows for totals or averages.
            </span>
          </li>
          <li>
            <span>
            <strong>Leave a cell blank if the person skipped the item.</strong> Blank, NA and −99 are all read as missing.
            </span>
          </li>
          <li>
            <span>
            <strong>An ID column is optional.</strong> Columns that do not look like rating-scale answers (text, or more than 11 different
            numbers) are ignored, and the lab lists them for you.
            </span>
          </li>
          <li>
            <span>
            <strong>Answers must be numbers</strong> (for example 1 to 5), not words. Keep reverse-worded items as people answered them; you
            tick “Reverse” in the lab.
            </span>
          </li>
        </ol>
      </figcaption>
    </figure>
  );
}

function MiniTable({ head, rows, bad }: { head: string[]; rows: string[][]; bad?: (r: number, c: number) => boolean }) {
  return (
    <table className="mini mistake-table">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((v, j) => (
              <td key={j} className={bad?.(i, j) ? "bad-cell" : undefined}>
                {v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CsvMistakes() {
  return (
    <div className="mistakes">
      <p className="mistakes-title">Three common mistakes</p>
      <div className="mistakes-grid">
        <div>
          <MiniTable
            head={["SE1", "SE2", "SE3"]}
            rows={[
              ["Agree", "Strongly agree", "Neutral"],
              ["Disagree", "Agree", "Agree"],
            ]}
            bad={() => true}
          />
          <p className="small">
            <strong>Answers as words.</strong> Recode them as numbers first (Strongly disagree = 1 … Strongly agree = 5). In Qualtrics, export
            “numeric values”; in Google Forms, use a linear scale question.
          </p>
        </div>
        <div>
          <MiniTable
            head={["Q1", "Q2", "Q3"]}
            rows={[
              ["I can organise my ideas…", "I can write a…", "I can revise…"],
              ['{"ImportId":"QID1"}', '{"ImportId":"QID2"}', '{"ImportId":"QID3"}'],
              ["4", "5", "4"],
            ]}
            bad={(r) => r < 2}
          />
          <p className="small">
            <strong>Extra header rows.</strong> Qualtrics exports add two rows under the names (question text and an import ID). Delete them so
            row 2 is the first person.
          </p>
        </div>
        <div>
          <MiniTable
            head={["gender", "year", "SE1", "SE2"]}
            rows={[
              ["1", "2", "4", "5"],
              ["2", "3", "3", "3"],
            ]}
            bad={(_, c) => c < 2}
          />
          <p className="small">
            <strong>Other short-coded columns.</strong> Codes such as gender (1/2) or year level (1–4) look like rating-scale answers and would be
            analysed as items. Delete them, or keep a copy of the file with only the questionnaire items.
          </p>
        </div>
      </div>
    </div>
  );
}
