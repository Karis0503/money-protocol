"use client";

import { FormEvent, useState, useEffect } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export function ChatClient() {
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

  // =========================
  // 🚫 BLOCK CHECK
  // =========================
  const isBlocked =
    actions.length > 0 &&
      insight?.shouldBlock &&
      actions.length > 0;

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

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.message ?? data.error ?? "Unknown response"
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
          <p>⚙️ Mode: {insight.mode}</p>
          <p>{insight.shouldBlock ? "🚫 BLOCKED" : "✅ Allowed"}</p>
          <p>💡 {insight.recommendation}</p>
        </div>
      )}

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
