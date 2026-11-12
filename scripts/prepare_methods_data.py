"""Build the real-data files used by the statistics modules.

Sources (download first):
  english.rda, dative.rda  from the languageR package (Baayen, 2008; GPL >= 2),
                           https://github.com/cran/languageR/tree/master/data
  ELLIPSE_Final_github_train.csv  from the ELLIPSE corpus (Crossley et al., 2023; CC BY 4.0),
                           https://github.com/scrosseye/ELLIPSE-Corpus

Run:  python scripts/prepare_methods_data.py <dir with the two .rda files> <ELLIPSE csv>
Writes compact column-oriented JSON to web/public/data/ and CSV copies to data/.
Demographic columns in ELLIPSE (gender, race/ethnicity, socio-economic status) are not used.
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pyreadr

OUT = Path("web/public/data")
CSV = Path("data")


def write(name: str, df: pd.DataFrame, meta: dict) -> None:
    cols = {}
    for c in df.columns:
        s = df[c]
        if pd.api.types.is_numeric_dtype(s):
            cols[c] = [None if pd.isna(v) else round(float(v), 6) for v in s]
        else:
            cols[c] = [None if pd.isna(v) else str(v) for v in s]
    (OUT / f"{name}.json").write_text(json.dumps({**meta, "n": len(df), "columns": cols}, ensure_ascii=False))
    CSV.mkdir(exist_ok=True)
    df.to_csv(CSV / f"{name}.csv", index=False)
    print(name, df.shape)


def main(rda_dir: Path, ellipse_csv: Path) -> None:
    eng = list(pyreadr.read_r(rda_dir / "english.rda").values())[0]
    english = pd.DataFrame(
        {
            "word": eng["Word"].astype(str),
            "age": eng["AgeSubject"].astype(str),
            "category": eng["WordCategory"].astype(str).map({"N": "noun", "V": "verb"}),
            "rt_ms": np.exp(eng["RTlexdec"]),
            "log_rt": eng["RTlexdec"],
            "log_freq": eng["WrittenFrequency"],
            "familiarity": eng["Familiarity"],
            "length": eng["LengthInLetters"],
        }
    )
    write(
        "english",
        english,
        {
            "title": "Visual lexical decision times for 2,284 English words",
            "source": "languageR::english (Baayen, 2008), from Balota, Cortese & Pilotti (1999) and Balota et al. (2004). Licence: GPL (>= 2).",
        },
    )

    dat = list(pyreadr.read_r(rda_dir / "dative.rda").values())[0]
    dative = pd.DataFrame(
        {
            "realization": dat["RealizationOfRecipient"].astype(str),
            "modality": dat["Modality"].astype(str),
            "animacy": dat["AnimacyOfRec"].astype(str),
            "pronominal": dat["PronomOfRec"].astype(str),
            "definite": dat["DefinOfRec"].astype(str),
            "accessibility": dat["AccessOfRec"].astype(str),
            "len_recipient": dat["LengthOfRecipient"],
            "len_theme": dat["LengthOfTheme"],
            "verb": dat["Verb"].astype(str),
        }
    )
    write(
        "dative",
        dative,
        {
            "title": "The dative alternation in spoken and written English (3,263 clauses)",
            "source": "languageR::dative (Baayen, 2008), from Bresnan, Cueni, Nikitina & Baayen (2007): Switchboard and Wall Street Journal corpora. Licence: GPL (>= 2).",
        },
    )

    ell = pd.read_csv(ellipse_csv)
    ellipse = pd.DataFrame(
        {
            "grade": ell["grade"],
            "prompt": ell["prompt"],
            "words": ell["num_words"],
            "mtld": ell["MTLD"],
            "overall": ell["Overall"],
            "cohesion": ell["Cohesion"],
            "syntax": ell["Syntax"],
            "vocabulary": ell["Vocabulary"],
            "phraseology": ell["Phraseology"],
            "grammar": ell["Grammar"],
            "conventions": ell["Conventions"],
        }
    )
    write(
        "ellipse",
        ellipse,
        {
            "title": "Rated essays by English language learners in US grades 8–12 (3,911 essays)",
            "source": "ELLIPSE corpus, training set (Crossley et al., 2023). Licence: CC BY 4.0. Demographic columns are not used.",
        },
    )


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
