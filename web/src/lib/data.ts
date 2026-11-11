import { useEffect, useState } from "react";

export interface ItemMeta {
  id: string;
  text?: string;
  subscale: string;
  reverse: boolean;
  plantedProblem?: string | null;
}

export interface Dataset {
  key: string;
  name: string;
  source: string;
  scale: [number, number];
  scaleLabels?: string;
  items: ItemMeta[];
  X: (number | null)[][];
  dropped: string[];
  plantedProblems?: string[];
}

/** Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, newlines in quotes, ; or , delimiters. */
export function parseCsv(src: string): string[][] {
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : firstLine.includes("\t") && !firstLine.includes(",") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const MISSING = new Set(["", "na", "n/a", "nan", "null", ".", "-99", "-999", "999"]);

/** Group items by their name without trailing digits: SE1, SE2 → "SE"; q1, q2 → "q". */
export const prefixOf = (id: string) => id.replace(/[_\-. ]?\d+[a-z]?$/i, "") || id;

/** Build a dataset from CSV text: keep columns that are numeric in at least 90% of non-missing cells. */
export function datasetFromCsv(text: string, fileName: string): Dataset {
  const rows = parseCsv(text);
  if (rows.length < 3) throw new Error("The file needs a header row and at least two rows of responses.");
  const header = rows[0].map((h, j) => h.trim() || `item${j + 1}`);
  const body = rows.slice(1);
  const keep: number[] = [];
  const dropped: string[] = [];
  header.forEach((h, j) => {
    const vals = body.map((r) => (r[j] ?? "").trim()).filter((v) => !MISSING.has(v.toLowerCase()));
    const numeric = vals.filter((v) => /^-?\d+(\.\d+)?$/.test(v));
    const distinct = new Set(numeric).size;
    if (vals.length && numeric.length / vals.length >= 0.9 && distinct >= 2 && distinct <= 11) keep.push(j);
    else dropped.push(h);
  });
  if (keep.length < 3) throw new Error("Fewer than three item columns were found. Items must be numeric responses (for example 1–5) with one respondent per row.");
  const X = body.map((r) =>
    keep.map((j) => {
      const v = (r[j] ?? "").trim();
      if (MISSING.has(v.toLowerCase())) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }),
  );
  const flat = X.flat().filter((v): v is number => v !== null);
  const lo = Math.min(...flat), hi = Math.max(...flat);
  return {
    key: `upload:${fileName}`,
    name: fileName,
    source: "Your file. It is read in this browser and never uploaded.",
    scale: [lo, hi],
    items: keep.map((j) => ({ id: header[j], subscale: prefixOf(header[j]), reverse: false })),
    X,
    dropped,
  };
}

const cache = new Map<string, Promise<Dataset>>();

export function loadSample(key: "writing_ai_simulated" | "bfi"): Promise<Dataset> {
  if (!cache.has(key)) {
    cache.set(
      key,
      Promise.all([
        fetch(`./data/${key}.csv`).then((r) => {
          if (!r.ok) throw new Error(`Could not load ${key}.csv (HTTP ${r.status})`);
          return r.text();
        }),
        fetch(`./data/${key}.json`).then((r) => r.json()),
      ]).then(([csv, meta]) => {
        const d = datasetFromCsv(csv, meta.name);
        return {
          ...d,
          key,
          name: meta.name,
          source: meta.source,
          scale: meta.scale,
          scaleLabels: meta.scaleLabels,
          items: meta.items,
          plantedProblems: meta.plantedProblems,
        } as Dataset;
      }),
    );
  }
  return cache.get(key)!;
}

export function useSample(key: "writing_ai_simulated" | "bfi") {
  const [state, setState] = useState<{ data?: Dataset; error?: string }>({});
  useEffect(() => {
    let live = true;
    loadSample(key)
      .then((data) => live && setState({ data }))
      .catch((e: Error) => live && setState({ error: e.message }));
    return () => {
      live = false;
    };
  }, [key]);
  return state;
}

/** Fixed decimals with a true minus sign (U+2212) for negative values. */
export const fmt = (v: number, d = 2) => {
  if (!Number.isFinite(v)) return "–";
  const r = Math.abs(v) < 0.5 * 10 ** -d ? 0 : v; // avoid "−0.00" for tiny negatives
  return r.toLocaleString("en-AU", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/^-/, "\u2212");
};

/** APA style: no leading zero for values bounded by 1 (correlations, alpha, loadings). */
export const apa = (v: number, d = 2) => (Number.isFinite(v) ? fmt(v, d).replace(/^(\u2212?)0\./, "$1.") : "–");
