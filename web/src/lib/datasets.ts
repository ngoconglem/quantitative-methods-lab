import { useEffect, useState } from "react";

export interface Dataset {
  title: string;
  source: string;
  n: number;
  columns: Record<string, (number | string | null)[]>;
}

const cache = new Map<string, Promise<Dataset>>();

export function loadDataset(name: "english" | "dative" | "ellipse"): Promise<Dataset> {
  if (!cache.has(name)) {
    cache.set(
      name,
      fetch(`./data/${name}.json`).then((r) => {
        if (!r.ok) throw new Error(`Could not load ${name}.json (HTTP ${r.status})`);
        return r.json() as Promise<Dataset>;
      }),
    );
  }
  return cache.get(name)!;
}

export function useDataset(name: "english" | "dative" | "ellipse") {
  const [state, setState] = useState<{ data?: Dataset; error?: string }>({});
  useEffect(() => {
    let live = true;
    loadDataset(name)
      .then((data) => live && setState({ data }))
      .catch((e: Error) => live && setState({ error: e.message }));
    return () => {
      live = false;
    };
  }, [name]);
  return state;
}

export const num = (d: Dataset, col: string) => d.columns[col] as number[];
export const str = (d: Dataset, col: string) => d.columns[col] as string[];

/** Format a p-value in APA style. */
export function pFmt(p: number): string {
  if (p < 0.001) return "p < .001";
  return `p = ${p.toFixed(3).replace(/^0/, "")}`;
}
/** Format a number with given decimals; drop the leading zero when |x| < 1 if `apa`. */
export function f(x: number, d = 2, apa = false): string {
  const s = x.toFixed(d);
  const t = apa ? s.replace(/^(-?)0\./, "$1.") : s;
  return t.replace(/^-/, "−");
}
