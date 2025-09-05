import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, RotateCcw, Mic, StopCircle, FileText, ChevronRight, CheckCircle2 } from "lucide-react";

// === CONFIG ===
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"; // FastAPI base

// === UI PRIMITIVES (shadcn/ui style light wrappers) ===
const Button = ({ className = "", disabled, onClick, children, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm disabled:opacity-50 ${
      disabled ? "cursor-not-allowed" : "hover:shadow-md"
    } ${className}`}
  >
    {children}
  </button>
);

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl shadow-sm border p-4 md:p-6 ${className}`}>{children}</div>
);

const Pill = ({ children, className = "" }) => (
  <span className={`px-3 py-1 rounded-full text-xs md:text-sm border ${className}`}>{children}</span>
);

// === UTIL ===
const fmtTime = (secs) => {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// === APP ===
export default function App() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transcript, setTranscript] = useState([]); // {q, a}
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [sec, setSec] = useState(0);
  const timerRef = useRef(null);

  const progress = useMemo(() => (questions.length ? ((qIndex) / questions.length) * 100 : 0), [qIndex, questions.length]);

  // Fetch questions from backend
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const r = await fetch(`${API_BASE_URL}/questions`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!cancelled) {
          setQuestions(Array.isArray(data) ? data : data.questions || []);
        }
      } catch (e) {
        if (!cancelled) setError(`Couldn't load questions: ${e.message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => (cancelled = true);
  }, []);

  // Timer per question
  useEffect(() => {
    clearInterval(timerRef.current);
    setSec(0);
    timerRef.current = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [qIndex]);

  const currentQ = questions[qIndex] || "";

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = { question: currentQ, answer: answer.trim(), seconds: sec };
      const r = await fetch(`${API_BASE_URL}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setTranscript((t) => [...t, payload]);
      setAnswer("");
      if (qIndex < questions.length - 1) setQIndex((i) => i + 1);
    } catch (e) {
      setError(`Submit failed: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setQIndex(0);
    setTranscript([]);
    setSummary(null);
    setAnswer("");
    setSec(0);
  };

  const getSummary = async () => {
    setError("");
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE_URL}/summary`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setSummary(data);
    } catch (e) {
      setError(`Summary failed: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-3xl font-semibold">
          AI Mock Interview
        </motion.h1>
        <div className="flex items-center gap-2">
          <Pill className="bg-white">Backend: <span className="font-mono ml-1">{API_BASE_URL}</span></Pill>
          <Button className="bg-white" onClick={resetAll}>
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-5xl mx-auto px-4 pb-20 grid gap-6 md:grid-cols-3">
        {/* LEFT: Q&A */}
        <div className="md:col-span-2 grid gap-6">
          <Card>
            {loading ? (
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading questions…
              </div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : questions.length === 0 ? (
              <div className="text-slate-600">No questions received from server.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Pill className="bg-white">Question {qIndex + 1} / {questions.length}</Pill>
                  <Pill className="bg-white">Time: {fmtTime(sec)}</Pill>
                </div>
                <h2 className="text-lg md:text-xl font-medium leading-snug">{currentQ}</h2>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer…"
                  className="w-full h-40 md:h-48 rounded-2xl border p-4 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mic className="w-4 h-4" /> <span className="text-sm">(Optional) Dictate your answer using your browser mic.</span>
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !answer.trim()} className="bg-slate-900 text-white">
                    {qIndex === questions.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />} {qIndex === questions.length - 1 ? "Finish" : "Submit"}
                  </Button>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Transcript</h3>
              <Button onClick={getSummary} disabled={submitting} className="bg-white">
                <ChevronRight className="w-4 h-4" /> Get Summary
              </Button>
            </div>
            {transcript.length === 0 ? (
              <p className="text-slate-600">Your answers will appear here after you submit.</p>
            ) : (
              <ul className="space-y-3">
                {transcript.map((t, i) => (
                  <li key={i} className="border rounded-xl p-3 bg-white">
                    <p className="text-sm text-slate-500">Q{i + 1}.</p>
                    <p className="font-medium mb-2">{t.question}</p>
                    <p className="whitespace-pre-wrap text-slate-800">{t.answer}</p>
                    <p className="text-xs text-slate-500 mt-2">Time: {fmtTime(t.seconds || 0)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* RIGHT: Summary + Tips */}
        <div className="md:col-span-1 grid gap-6">
          <Card className="bg-white">
            <h3 className="font-medium mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Summary</h3>
            {!summary ? (
              <p className="text-slate-600">Click "Get Summary" to generate an evaluation from your transcript.</p>
            ) : (
              <div className="space-y-3">
                {typeof summary === "string" ? (
                  <p className="whitespace-pre-wrap">{summary}</p>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(summary, null, 2)}</pre>
                )}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-medium mb-3">Pro tips</h3>
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
              <li>Keep answers structured: Situation → Task → Action → Result.</li>
              <li>Be concise. Aim 60–120 seconds per answer.</li>
              <li>Use concrete metrics (%, revenue, latency, F1) where possible.</li>
            </ul>
          </Card>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-5xl mx-auto px-4 pb-10 text-center text-xs text-slate-500">
        Made with ❤ — Tailwind, Framer Motion. Configure API base via <code>VITE_API_BASE_URL</code>.
      </footer>
    </div>
  );
}
