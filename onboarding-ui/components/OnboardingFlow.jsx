"use client";

import { useEffect, useState } from "react";

const API_BASE = "/api/onboarding";

const STEP_ORDER = [
  { key: "about_you", label: "About you" },
  { key: "interests", label: "Interests" },
  { key: "personality", label: "Work Style" },
  { key: "study_plan", label: "Study Plan" },
  { key: "result", label: "Starter Plan" },
];

export default function OnboardingFlow({ flowId = "career_onboarding_v1" }) {
  const [sessionId, setSessionId] = useState(null);
  const [node, setNode] = useState(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentStepKey = node?.meta?.step || (done ? "result" : "about_you");
  const currentStepIndex = Math.max(
    0,
    STEP_ORDER.findIndex((s) => s.key === currentStepKey),
  );

  const startFlow = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow_id: flowId }),
      });

      const raw = await res.text();
      if (!res.ok) throw new Error(raw);

      const data = JSON.parse(raw);
      setSessionId(data.session_id);
      setNode(data.node);
      setDone(false);
      setResult(null);
      setContext(null);
    } catch (e) {
      console.error("startFlow error", e);
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  const sendAnswer = async (answer) => {
    if (!sessionId || !node) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          node_id: node.id,
          answer,
        }),
      });

      const raw = await res.text();
      if (!res.ok) throw new Error(raw);

      const data = JSON.parse(raw);
      setContext(data.context || null);

      if (data.done) {
        setDone(true);
        setResult(data.result);
        setNode(null);
      } else {
        setNode(data.node);
      }
    } catch (e) {
      console.error("sendAnswer error", e);
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="brand">Aveti Career Guide</div>
        <div className="sub">Let’s plan your future in a few quick steps</div>
      </header>

      <ProgressSteps currentIndex={currentStepIndex} />

      {error && <div className="error">{error}</div>}

      {!done && node && (
        <QuestionCard node={node} onSubmit={sendAnswer} loading={loading} />
      )}

      {done && result && (
        <ResultCard result={result} context={context} onRestart={startFlow} />
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f6f8fc;
          padding: 18px 12px 40px;
          font-family: Inter, system-ui, sans-serif;
        }
        .header {
          max-width: 760px;
          margin: 0 auto 14px;
          background: #0b1020;
          color: white;
          padding: 16px 18px;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        }
        .brand {
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.2px;
        }
        .sub {
          margin-top: 4px;
          font-size: 14px;
          opacity: 0.85;
        }
        .error {
          max-width: 760px;
          margin: 10px auto;
          background: #fff1f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 14px;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}

function ProgressSteps({ currentIndex }) {
  return (
    <div className="wrap">
      <div className="steps">
        {STEP_ORDER.map((s, i) => {
          const active = i <= currentIndex;
          return (
            <div key={s.key} className={`step ${active ? "active" : ""}`}>
              <div className="dot">{i + 1}</div>
              <div className="label">{s.label}</div>
              {i < STEP_ORDER.length - 1 && <div className="line" />}
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .wrap {
          max-width: 760px;
          margin: 0 auto 14px;
          padding: 8px 8px 2px;
        }
        .steps {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
        }
        .step {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 999px;
          background: #e9edf5;
          color: #475569;
          font-size: 12px;
          white-space: nowrap;
        }
        .step.active {
          background: #111827;
          color: white;
        }
        .dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.25);
        }
        .label {
          font-weight: 600;
        }
        .line {
          width: 12px;
          height: 2px;
          background: #cbd5e1;
          margin-left: 6px;
          border-radius: 99px;
        }
        .step.active .line {
          background: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
}

function QuestionCard({ node, onSubmit, loading }) {
  const ui = node.ui || {};
  const [answer, setAnswer] = useState(null);

  const options = ui.options || [];
  const inputType = ui.input_type;
  const canNext = !!answer;

  return (
    <div className="card-wrap">
      <div className="card">
        <div className="step-tag">
          {node.meta?.label ||
            STEP_ORDER.find((s) => s.key === node.meta?.step)?.label}
        </div>

        <h2 className="q">{ui.question_text}</h2>
        {ui.description && <p className="desc">{ui.description}</p>}

        {inputType === "single_choice" && (
          <div className="chips">
            {options.map((opt) => (
              <button
                key={opt.id}
                className={`chip ${answer === opt.id ? "selected" : ""}`}
                onClick={() => setAnswer(opt.id)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <button
          className="next"
          disabled={!canNext || loading}
          onClick={() => onSubmit(answer)}
        >
          {loading ? "Saving..." : "Next"}
        </button>
      </div>

      <style jsx>{`
        .card-wrap {
          max-width: 760px;
          margin: 0 auto;
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          border: 1px solid #e6e9f0;
          animation: fadeIn 180ms ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .step-tag {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          background: #eef2ff;
          padding: 6px 10px;
          border-radius: 999px;
          margin-bottom: 10px;
        }
        .q {
          font-size: 20px;
          font-weight: 700;
          color: #0b1020;
          margin: 0 0 6px;
        }
        .desc {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 14px;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }
        .chip {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          transition: all 140ms ease;
        }
        .chip:hover {
          transform: translateY(-1px);
          border-color: #111827;
        }
        .chip.selected {
          background: #111827;
          color: white;
          border-color: #111827;
          box-shadow: 0 8px 18px rgba(17, 24, 39, 0.25);
        }
        .next {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: none;
          background: #111827;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .next:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function ResultCard({ result, context, onRestart }) {
  const traits = result?.summary?.top_traits || [];
  const vars = result?.summary?.variables || {};
  const answers = result?.summary?.answers || {};

  return (
    <div className="card-wrap">
      <div className="card">
        <h2 className="title">Your Starter Plan</h2>

        <div className="section">
          <h3>Top traits</h3>
          {traits.length === 0 ? (
            <p className="muted">No traits detected yet.</p>
          ) : (
            <div className="chips">
              {traits.map((t) => (
                <span className="chip selected" key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h3>Your answers (derived)</h3>
          <pre>{JSON.stringify(vars, null, 2)}</pre>
        </div>

        <div className="section">
          <h3>All raw answers</h3>
          <pre>{JSON.stringify(answers, null, 2)}</pre>
        </div>

        <button className="next" onClick={onRestart}>
          Restart
        </button>
      </div>

      <style jsx>{`
        .card-wrap {
          max-width: 760px;
          margin: 0 auto;
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          border: 1px solid #e6e9f0;
        }
        .title {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .section {
          margin: 14px 0;
        }
        h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .muted {
          color: #64748b;
          font-size: 14px;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }
        .chip.selected {
          background: #111827;
          color: white;
          border-color: #111827;
        }
        pre {
          background: #0b1020;
          color: #e5e7eb;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          overflow-x: auto;
        }
        .next {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: none;
          background: #111827;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
