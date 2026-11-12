import { useEffect, useState } from "react";

const KEY = "qml-walkthrough-hidden";
const EVENT = "qml-walkthrough";

const read = () => {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};
const write = (hidden: boolean) => {
  try {
    if (hidden) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the choice lasts for this visit only */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: hidden }));
};

function useHidden() {
  const [hidden, setHidden] = useState(read);
  useEffect(() => {
    const on = (e: Event) => setHidden((e as CustomEvent<boolean>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return hidden;
}

const STEPS = [
  {
    title: "Choose where to start",
    body: (
      <>
        New to research? Read the <a href="#intro">Introduction</a>, then follow the levels from <a href="#descriptive">Descriptive</a> to{" "}
        <a href="#modelling">Modelling</a>. Have a study in mind? Use <a href="#tests">Which test?</a>.
      </>
    ),
  },
  { title: "Read the key idea", body: <>Each module opens with a short box: what the method does and the few terms you need.</> },
  { title: "Try it", body: <>Change the buttons, sliders and tick-boxes. Charts and numbers update straight away, using real or clearly labelled simulated data.</> },
  { title: "Check, report, run", body: <>Answer the quiz, copy the reporting sentence, and open the R or Python code to repeat it on your own data.</> },
];

/** A dismissible “how to use this site” box for first-time visitors. */
export function Walkthrough() {
  const hidden = useHidden();
  if (hidden) return null;
  return (
    <aside className="walkthrough" aria-labelledby="walkthrough-title">
      <div className="walkthrough-head">
        <h2 id="walkthrough-title">New here? How to use this site</h2>
        <button className="walkthrough-close" onClick={() => write(true)} aria-label="Hide this guide">
          ×
        </button>
      </div>
      <ol className="walkthrough-steps">
        {STEPS.map((s) => (
          <li key={s.title}>
            <strong>{s.title}</strong>
            <span>{s.body}</span>
          </li>
        ))}
      </ol>
      <ul className="walkthrough-tips">
        <li>
          <span className="wt-under">Underlined words</span> show a short definition when clicked.
        </li>
        <li>
          <span className="guide-icon" aria-hidden="true">i</span> lines open a longer explanation; the <strong>Guidance</strong> button
          at the top hides or shows them.
        </li>
        <li>
          <span className="sim-tag">Simulated data</span> marks invented data made for teaching.
        </li>
      </ul>
      <div className="walkthrough-actions">
        <a className="button" href="#start">
          Take the 15-minute tour
        </a>
        <button className="button-quiet" onClick={() => write(true)}>
          Got it, hide this guide
        </button>
      </div>
    </aside>
  );
}

/** Footer link that brings the guide back. */
export function ShowWalkthrough() {
  const hidden = useHidden();
  if (!hidden) return null;
  return (
    <button
      className="link-button"
      onClick={() => {
        write(false);
        window.scrollTo({ top: 0 });
      }}
    >
      How to use this site
    </button>
  );
}
