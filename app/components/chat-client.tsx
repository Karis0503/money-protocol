"use client";

import { FormEvent, useState, useEffect } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export function ChatClient() {
  const [history, setHistory] = useState<any[]>([]);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Welcome to Money Protocol. Send a transaction like 'makan 50k' or 'gaji 5 juta'."
    }
  ]);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const [actions, setActions] = useState<any[]>([]);
  const [insight, setInsight] = useState<any>(null); // 🔥 TAMBAHAN PENTING
  const [review, setReview] = useState<any>(null);
  const [mode, setMode] = useState("relaxed");

  // =========================
  // 🔄 FETCH ACTIONS
  // =========================
  useEffect(() => {
    const fetchActions = async () => {
      const res = await fetch("/api/actions");
      const data = await res.json();
      setActions(data);
    };

    fetchActions();
    const interval = setInterval(fetchActions, 3000);
    return () => clearInterval(interval);
  }, []);

  
 const fetchHistory = async () => {
  const res = await fetch("/api/history");
  const data = await res.json();
  setHistory(data);
};

  const fetchReview = async () => {
  const clearHistory = async () => {
  const confirmClear = confirm("Yakin mau hapus semua history?");
  if (!confirmClear) return;
  await fetch("/api/clear", {
    method: "DELETE",
  });

  // refresh UI
  setHistory([]);
  setInsight(null);
  setReview(null);
};
  const res = await fetch("/api/review");
  const data = await res.json();
  setReview(data);
};

useEffect(() => {
  fetchHistory();
}, []);
  
  // =========================
  // 🚫 BLOCK CHECK
  // =========================
  const isBlocked =
    insight?.shouldBlock && actions.length > 0;

  // =========================
  // 📤 SUBMIT
  // =========================
  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (isBlocked) {
      alert("🚫 AI BLOCKED: " + actions[0].command);
      return;
    }

    const payload = text.trim();
    if (!payload) return;

    setMessages((prev) => [...prev, { role: "user", text: payload }]);
    setText("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: payload })
      });

      const data = await res.json();

      // 🔥 INI YANG BIKIN AI LU "HIDUP"
      setInsight(data.insight);
      await fetchHistory();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Recorded ${data.parsed.type} ${data.parsed.amount} in ${data.parsed.category}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-shell">
      <button
  onClick={fetchReview}
  style={{
    marginBottom: "10px",
    padding: "6px 12px",
    background: "#222",
    borderRadius: "6px",
  }}
>
  📊 Monthly Review
</button>
      <div>
  <h1 style={{
  fontSize: "32px",
  fontWeight: "bold",
  background: "linear-gradient(90deg, #00c6ff, #0072ff)",
  WebkitBackgroundClip: "text",
  color: "transparent"
}}>
  Money Protocol
</h1>
  <p>Personal Finance Operating System</p>

  {/* ⚙️ MODE SWITCH */}
  <div style={{ marginTop: "10px" }}>
    {["relaxed", "strict", "brutal"].map((m) => (
      <button
        key={m}
        onClick={async () => {
          setMode(m);

          await fetch("/api/mode", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mode: m })
          });
        }}
        style={{
          marginRight: "8px",
          padding: "6px 12px",
          borderRadius: "6px",
          background: mode === m ? "#444" : "#222",
          color: "white",
          cursor: "pointer"
        }}
      >
        {m.toUpperCase()}
      </button>
    ))}
  </div>
</div>

      {/* ========================= */}
      {/* 🚫 WARNING */}
      {/* ========================= */}
      {isBlocked && (
        <div
          style={{
            background: "#ff4d4f",
            color: "white",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "10px"
          }}
        >
          🚫 AI is restricting actions: {actions[0].command}
        </div>
      )}

      {/* ========================= */}
      {/* 🔥 AI INSIGHT (FIXED) */}
      {/* ========================= */}
{insight && (
  <div
    className="card"
    style={{
  marginBottom: "12px",
  padding: "16px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 0 20px rgba(0,0,0,0.4)"
}}
  >
    <h3>🔥 AI Insight</h3>
<p
  style={{
    fontSize: "20px",
    fontWeight: "bold",
    color:
      insight.score < 40
        ? "red"
        : insight.score < 70
        ? "orange"
        : "#4caf50"
  }}
>
  <p style={{
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center"
}}>
  {insight.score}/100
</p>

  <span style={{ marginLeft: "10px", fontSize: "14px" }}>
    {insight.delta < 0 ? "📉" : "📈"} {insight.delta}
  </span>
</p>
    <p style={{ opacity: 0.7, fontSize: "12px" }}>
  Real-time behavioral analysis
</p>

    {insight.habitWarning && (
      <p style={{ color: "#ff9800" }}>
        ⚠️ {insight.habitWarning}
      </p>
    )}

    <p>🍔 Food ratio: {(insight.ratio * 100).toFixed(0)}%</p>
    <p>⚠️ Severity: {insight.severity}</p>
    <p>⚙️ Mode: {mode}</p>
    <p>{insight.shouldBlock ? "🚫 BLOCKED" : "✅ Allowed"}</p>
    <p>💡 {insight.recommendation}</p>
    <p>
  🧠 AI says:{" "}
  {insight.severity === "high"
    ? "You're losing control."
    : insight.severity === "medium"
    ? "You're slipping."
    : "You're in control."}
</p>
    {mode === "brutal" && insight.severity === "high" && (
  <p style={{ color: "red" }}>
    💀 Stop lying to yourself.
  </p>
)}
  </div>
)}

      {review && (
  <div style={{ marginTop: "10px", border: "1px solid #333", padding: "10px" }}>
    <p>📊 Monthly Review</p>
    <p>💰 Income: {review.totalIncome}</p>
    <p>💸 Expense: {review.totalExpense}</p>
    <p>🧠 Score: {review.score}</p>
    <p>{review.insightSummary}</p>
  </div>
)}

      {/* 🧾 HISTORY */}
<div className="card" style={{ marginBottom: "10px" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <h3>🧾 History</h3>

  <button
    onClick={clearHistory}
    style={{
      padding: "4px 10px",
      background: "rgba(255,0,0,0.1)",
      border: "1px solid rgba(255,0,0,0.3)",
      borderRadius: "6px",
      color: "#ff4d4f",
      cursor: "pointer"
    }}
  >
    🗑 Clear
  </button>
</div>

  {history.length === 0 && <p>No transactions yet</p>}

  {history.map((tx) => (
    <div
      key={tx.id}
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid #222"
      }}
    >
      <span style={{ textTransform: "capitalize" }}>
  {tx.category}
</span>

<span
  style={{
    fontWeight: "bold",
    color: tx.type === "income" ? "#4caf50" : "#ff4d4f"
  }}
>
  {tx.type === "income" ? "+" : "-"}{" "}
  {tx.amount.toLocaleString()}
</span>
    </div>
  ))}
</div>

      {/* ========================= */}
      {/* 💬 CHAT */}
      {/* ========================= */}
      <div className="card messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.text}
          </div>
        ))}
      </div>

      {/* ========================= */}
      {/* ✍️ INPUT */}
      {/* ========================= */}
      <form className="card composer" onSubmit={onSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type: makan 50k"
          disabled={isBlocked}
        />

        <button type="submit" disabled={loading || isBlocked}>
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
