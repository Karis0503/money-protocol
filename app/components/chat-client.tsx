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

  const isBlocked =
    actions.length > 0 &&
    (actions[0].command.toLowerCase().includes("stop") ||
      actions[0].command.toLowerCase().includes("do not"));

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
      <div>
        <h1>Money Protocol</h1>
        <p>Personal Finance Operating System</p>
      </div>

      {/* 🔥 WARNING */}
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

      {/* 🔥 AI INSIGHT */}
      {messages.length > 1 && (
        <div className="card" style={{ marginBottom: "10px" }}>
          <h3>🔥 AI Insight</h3>
          <pre style={{ whiteSpace: "pre-wrap", opacity: 0.8 }}>
            {messages[messages.length - 1].text}
          </pre>
        </div>
      )}

      {/* 💬 CHAT */}
      <div className="card messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.text}
          </div>
        ))}
      </div>

      {/* ✍️ INPUT */}
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
