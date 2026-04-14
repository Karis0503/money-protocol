"use client";

import { FormEvent, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export function ChatClient() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Welcome to Money Protocol. Send a transaction like 'makan 50k' or 'gaji 5 juta'." }
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
      setMessages((prev) => [...prev, { role: "assistant", text: data.message ?? data.error ?? "Unknown response" }]);
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

      <div className="card messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.text}
          </div>
        ))}
      </div>

      <form className="card composer" onSubmit={onSubmit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type: makan 50k" />
        <button type="submit" disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
