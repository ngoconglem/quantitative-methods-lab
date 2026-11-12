"""Simulate the teaching dataset `intercultural` (SIMULATED: no real participants).

A survey of 600 university language learners, built so that every module has an
intercultural-communication example with known answers:

* abroad: time spent abroad (None / Short / Long), for comparing three groups;
* contact_hours: weekly hours of contact with people from other cultures (right-skewed);
* proficiency: English test score (0-100);
* KN1-5, AT1-5, SK1-5, AW1-5: a 20-item intercultural competence questionnaire (1-5) with
  four dimensions modelled on Byram's (1997) model: knowledge, attitudes, skills of
  interaction, critical cultural awareness. AT2 is negatively worded. AT5 is deliberately
  weak and SK4 deliberately cross-loads on awareness, so EFA has something to find;
* wtc: willingness to communicate in English (1-7); anxiety: speaking anxiety (1-5);
* exchange: applied for an exchange programme (1 = yes).

    python -I scripts/simulate_intercultural.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
rng = np.random.default_rng(20261113)
N = 600

ITEMS = {
    "KN1": "I know the basic customs of at least one other culture.",
    "KN2": "I can explain how communication styles differ between cultures.",
    "KN3": "I know about the history and values of people from other cultures I meet.",
    "KN4": "I understand how my own culture shapes the way I see others.",
    "KN5": "I know where to find reliable information about other cultures.",
    "AT1": "I enjoy meeting people from other cultures.",
    "AT2": "I feel uncomfortable when people from other cultures behave differently.",
    "AT3": "I am curious about how people from other cultures live.",
    "AT4": "I am willing to question my own views when I learn about other cultures.",
    "AT5": "I like trying food from other countries.",
    "SK1": "I can adjust how I speak when talking with people from other cultures.",
    "SK2": "I can tell when a misunderstanding is caused by cultural differences.",
    "SK3": "I can explain my own culture to people from elsewhere.",
    "SK4": "I can compare practices in my culture and another culture without judging.",
    "SK5": "I can keep a conversation going with someone from a different culture.",
    "AW1": "I evaluate cultural practices, including my own, using clear criteria.",
    "AW2": "I notice stereotypes in news and social media.",
    "AW3": "I can see that my own values are one possibility among many.",
    "AW4": "I think about how culture affects my judgements of others.",
    "AW5": "I can discuss sensitive cultural topics respectfully.",
}
FACTOR = {k: "KNATSKAW".index(k[:2]) // 2 for k in ITEMS}
LOAD = {"KN1": .70, "KN2": .75, "KN3": .65, "KN4": .60, "KN5": .62,
        "AT1": .78, "AT2": -.55, "AT3": .74, "AT4": .62, "AT5": .28,
        "SK1": .72, "SK2": .68, "SK3": .66, "SK4": .45, "SK5": .76,
        "AW1": .60, "AW2": .64, "AW3": .70, "AW4": .72, "AW5": .58}
CROSS = {"SK4": (3, .40)}  # SK4 also loads on awareness

PHI = np.array([[1, .50, .55, .55], [.50, 1, .45, .50], [.55, .45, 1, .55], [.55, .50, .55, 1]])

abroad = rng.choice(["None", "Short", "Long"], size=N, p=[.5, .3, .2])
g = pd.Series(abroad).map({"None": 0, "Short": 1, "Long": 2}).to_numpy()
contact = np.round(rng.gamma(shape=2.0, scale=np.array([1.2, 2.0, 3.4])[g]), 1)
lc = (np.log1p(contact) - np.log1p(contact).mean()) / np.log1p(contact).std()
shift = np.array([[0, 0, 0, 0], [.25, .15, .30, .20], [.55, .30, .60, .45]])[g]
eta = rng.multivariate_normal(np.zeros(4), PHI, size=N) * 0.9 + shift + 0.25 * lc[:, None]
eta = (eta - eta.mean(0)) / eta.std(0)

cols = {}
for k, lam in LOAD.items():
    f = FACTOR[k]
    signal = lam * eta[:, f]
    if k in CROSS:
        signal = signal + CROSS[k][1] * eta[:, CROSS[k][0]]
    resid_sd = np.sqrt(max(0.05, 1 - lam**2 - (CROSS[k][1] ** 2 if k in CROSS else 0)))
    x = signal + rng.normal(0, resid_sd, N)
    cuts = np.array([-1.7, -0.8, 0.15, 1.05]) + rng.normal(0, 0.12, 4) - 0.15
    cols[k] = 1 + np.searchsorted(np.sort(cuts), x)

icc = np.column_stack([cols[k] if k != "AT2" else 6 - cols[k] for k in ITEMS]).mean(1)
icc_z = (icc - icc.mean()) / icc.std()
prof = np.clip(np.round(60 + np.array([0, 6, 11])[g] + 6 * eta[:, 2] + rng.normal(0, 10, N)), 0, 100)
prof_z = (prof - prof.mean()) / prof.std()
anxiety = np.clip(np.round(3.0 - 0.35 * prof_z - 0.25 * icc_z + rng.normal(0, 0.7, N), 1), 1, 5)
anx_z = (anxiety - anxiety.mean()) / anxiety.std()
wtc = np.clip(np.round(4.0 + 0.45 * icc_z + 0.35 * prof_z - 0.30 * anx_z + rng.normal(0, 0.8, N), 1), 1, 7)
wtc_z = (wtc - wtc.mean()) / wtc.std()
p_ex = 1 / (1 + np.exp(-(-1.0 + 0.8 * wtc_z + 0.4 * icc_z - 0.3 * anx_z)))
exchange = (rng.random(N) < p_ex).astype(int)

d = pd.DataFrame({"id": np.arange(1, N + 1), "abroad": abroad, "contact_hours": contact, "proficiency": prof.astype(int),
                  **{k: v.astype(int) for k, v in cols.items()}, "wtc": wtc, "anxiety": anxiety, "exchange": exchange,
                  "half": np.where(rng.permutation(N) < N // 2, "A", "B")})
(ROOT / "data").mkdir(exist_ok=True)
d.to_csv(ROOT / "data" / "intercultural_simulated.csv", index=False)
meta = {
    "simulated": True,
    "note": "SIMULATED data for teaching. No real participants. Generated by scripts/simulate_intercultural.py (seed 20261113).",
    "items": ITEMS, "reversed": ["AT2"],
    "dimensions": {"KN": "Knowledge", "AT": "Attitudes", "SK": "Skills of interaction", "AW": "Critical cultural awareness"},
}
out = {"title": "Intercultural competence survey (SIMULATED)", "source": meta["note"], "n": N, "meta": meta,
       "columns": {c: d[c].tolist() for c in d.columns}}
(ROOT / "web" / "public" / "data" / "intercultural.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print(d.groupby("abroad")[["contact_hours", "proficiency", "wtc"]].mean().round(2))
print("exchange rate", exchange.mean().round(3), "icc by group", pd.Series(icc).groupby(abroad).mean().round(2).to_dict())
