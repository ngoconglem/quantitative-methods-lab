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
  { title: "Read the key idea", body: <>Each module starts with a short box: what the method is for, and the few words you need to know.</> },
  { title: "Try it", body: <>Click the buttons and move the sliders. The charts and numbers change straight away.</> },
  { title: "Check and use it", body: <>Answer the short quiz, copy the example sentence for your report, and get the R or Python code for your own data.</> },
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
          Click an <span className="wt-under">underlined word</span> to see what it means.
        </li>
        <li>
          Click a line marked <span className="guide-icon" aria-hidden="true">i</span> for more explanation. The <strong>Guidance</strong>{" "}
          button at the top hides or shows these.
        </li>
        <li>
          <span className="sim-tag">Simulated data</span> means made-up data, created for teaching.
        </li>
      </ul>
      <div className="walkthrough-actions">
        <a className="button" href="#intro">
          Read the introduction
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
