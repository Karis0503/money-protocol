"use client";

import { useEffect, useState } from "react";
import { ChatClient } from "@/app/components/chat-client";

export default function Home() {
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

  return (
    <main className="container">
      
      {actions.length > 0 && (
        <div style={{
          background: "red",
          color: "white",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "10px"
        }}>
          🚨 AI COMMAND: {actions[0].command}
        </div>
      )}

      <ChatClient />

    </main>
  );
}
