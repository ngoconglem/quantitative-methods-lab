"""Build the two sample datasets used by the Scale Validation Lab.

1. bfi.csv: 2,800 responses to 25 IPIP Big Five items (6-point scale), from the
   psychTools R package (Revelle), data from the SAPA project. Licence: GPL (>= 2).
   Item wordings are from the International Personality Item Pool (public domain).
2. writing_ai_simulated.csv: a simulated 15-item "Academic Writing with AI" questionnaire
   (5-point scale, n = 320) with a known three-factor structure and four planted problems,
   so learners can check whether each analysis finds them.

Run:  python -I scripts/prepare_data.py <path/to/bfi.rda> <path/to/bfi.dictionary.rda>
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pyreadr

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def build_bfi(rda: str, dictionary: str) -> None:
    df = list(pyreadr.read_r(rda).values())[0]
    d = list(pyreadr.read_r(dictionary).values())[0]
    items = [c for c in df.columns if c[0] in "ACENO" and c[1:].isdigit()]
    out = df[items].copy()
    out.to_csv(OUT / "bfi.csv", index=False, na_rep="")
    meta = {
        "name": "Big Five Inventory items (bfi)",
        "source": "psychTools R package (Revelle, 2024); data from the SAPA project. Licence: GPL (>= 2). Item wordings: International Personality Item Pool (public domain).",
        "n": int(len(out)),
        "scale": [1, 6],
        "scaleLabels": "1 = Very inaccurate … 6 = Very accurate",
        "items": [
            {
                "id": i,
                "text": d.loc[i, "Item"],
                "subscale": {"A": "Agreeableness", "C": "Conscientiousness", "E": "Extraversion", "N": "Neuroticism", "O": "Openness"}[i[0]],
                "reverse": bool(d.loc[i, "Keying"] == -1),
            }
            for i in items
        ],
    }
    (OUT / "bfi.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print("bfi", out.shape, "missing", int(out.isna().sum().sum()))


SIM_ITEMS = [
    # id, text, subscale, true loading, notes
    ("SE1", "I can organise my ideas clearly when I write in English.", "Writing self-efficacy", 0.75, ""),
    ("SE2", "I can write a well-structured academic paragraph without help.", "Writing self-efficacy", 0.72, ""),
    ("SE3", "I can revise my own drafts to make them clearer.", "Writing self-efficacy", 0.70, ""),
    ("SE4", "I feel confident using academic vocabulary accurately.", "Writing self-efficacy", 0.68, ""),
    ("SE5", "I can explain the main argument of my essay in one sentence.", "Writing self-efficacy", 0.20, "weak item"),
    ("CE1", "I check AI-generated text against reliable sources.", "Critical evaluation of AI output", 0.74, ""),
    ("CE2", "I notice when an AI tool gives a confident but wrong answer.", "Critical evaluation of AI output", 0.70, ""),
    ("CE3", "I question whether AI suggestions fit my own argument.", "Critical evaluation of AI output", 0.72, ""),
    ("CE4", "I accept AI-generated references without checking them.", "Critical evaluation of AI output", -0.66, "reverse-worded; not recoded in the file"),
    ("CE5", "I compare answers from AI with what my teacher has taught.", "Critical evaluation of AI output", 0.62, ""),
    ("DA1", "I find it hard to start writing without an AI tool.", "Dependence on AI", 0.76, ""),
    ("DA2", "I use AI to write sentences I could write myself.", "Dependence on AI", 0.72, ""),
    ("DA3", "I feel anxious when I cannot use AI for an assignment.", "Dependence on AI", 0.70, ""),
    ("DA4", "I let AI decide how to structure my essays.", "Dependence on AI", 0.50, "cross-loads on self-efficacy (-0.55)"),
    ("DA5", "I copy AI wording into my assignments with few changes.", "Dependence on AI", 0.66, ""),
]
SIM_PHI = np.array([[1.0, 0.35, -0.30], [0.35, 1.0, -0.25], [-0.30, -0.25, 1.0]])
SEED = 2026


def build_simulated() -> None:
    rng = np.random.default_rng(SEED)
    n = 320
    factors = ["Writing self-efficacy", "Critical evaluation of AI output", "Dependence on AI"]
    L = np.zeros((len(SIM_ITEMS), 3))
    for i, (_, _, sub, lam, _) in enumerate(SIM_ITEMS):
        L[i, factors.index(sub)] = lam
    L[13, 0] = -0.55  # DA4 cross-loading on self-efficacy
    F = rng.multivariate_normal(np.zeros(3), SIM_PHI, size=n)
    common = F @ L.T
    uniq = np.sqrt(np.clip(1 - (L @ SIM_PHI * L).sum(axis=1), 0.05, None))
    latent = common + rng.standard_normal((n, len(SIM_ITEMS))) * uniq
    # Ordinal 1-5 via fixed thresholds (slightly skewed towards agreement)
    cuts = np.array([-1.6, -0.7, 0.2, 1.1])
    data = np.digitize(latent, cuts) + 1
    df = pd.DataFrame(data, columns=[i[0] for i in SIM_ITEMS]).astype("Int64")
    # Missing completely at random, about 2% of cells
    mask = rng.random(df.shape) < 0.02
    df = df.mask(mask)
    df.to_csv(OUT / "writing_ai_simulated.csv", index=False, na_rep="")
    meta = {
        "name": "Academic Writing with AI questionnaire (simulated)",
        "source": "Simulated for teaching (seed 2026). Not real respondents. True structure: three correlated factors with five items each.",
        "n": n,
        "scale": [1, 5],
        "scaleLabels": "1 = Strongly disagree … 5 = Strongly agree",
        "items": [
            {"id": i, "text": t, "subscale": s, "reverse": i == "CE4", "plantedProblem": note or None}
            for (i, t, s, _, note) in SIM_ITEMS
        ],
        "plantedProblems": [
            "CE4 is reverse-worded and has not been recoded in the file.",
            "SE5 is a weak item (true loading .20).",
            "DA4 cross-loads negatively on Writing self-efficacy.",
            "About 2% of responses are missing at random.",
        ],
        "trueFactorCorrelations": SIM_PHI.tolist(),
    }
    (OUT / "writing_ai_simulated.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print("simulated", df.shape, "missing", int(df.isna().sum().sum()))


if __name__ == "__main__":
    build_bfi(sys.argv[1], sys.argv[2])
    build_simulated()
