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
      {/* ========================= */}
      {/* 🧠 HEADER */}
      {/* ========================= */}
      <div>
  <h1>Money Protocol</h1>
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
          {insight.habitWarning && (
  <p style={{ color: "#ff9800" }}>
    ⚠️ {insight.habitWarning}
  </p>
)}
          className="card"
          style={{
            marginBottom: "10px",
            border:
              insight.severity === "high"
                ? "1px solid red"
                : insight.severity === "medium"
                ? "1px solid orange"
                : "1px solid green"
          }}
        >
          <h3>🔥 AI Insight</h3>

          <p>🍔 Food ratio: {(insight.ratio * 100).toFixed(0)}%</p>
          <p>⚠️ Severity: {insight.severity}</p>
          <p>⚙️ Mode: {mode}</p>
          <p>{insight.shouldBlock ? "🚫 BLOCKED" : "✅ Allowed"}</p>
          <p>💡 {insight.recommendation}</p>
        </div>
      )}

      {/* 🧾 HISTORY */}
<div className="card" style={{ marginBottom: "10px" }}>
  <h3>🧾 History</h3>

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
