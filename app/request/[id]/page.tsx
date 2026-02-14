// app/request/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type MessageRow = {
  id: number;
  request_id: number;
  sender_id?: number | null;
  sender_name?: string | null; // if your table has it later
  body: string;
  created_at?: string;
};

export default function RequestDetail({ params }: { params: { id: string } }) {
  const requestId = useMemo(() => Number(params.id), [params.id]);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadMessages = async () => {
    setError("");
    try {
      const res = await fetch(`/.netlify/functions/messages-get?id=${requestId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load messages");
    }
  };

  useEffect(() => {
    if (!requestId) return;
    loadMessages();

    // Light polling so chat feels alive without sockets
    const t = setInterval(loadMessages, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const sendMessage = async () => {
    setError("");
    const body = text.trim();
    if (!body) return;

    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/messages-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, body }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to send message");
      }

      setText("");
      await loadMessages();
    } catch (e: any) {
      setError(e?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <a href="/" style={{ textDecoration: "underline" }}>
          ← Back to board
        </a>
      </div>

      <h1>Request #{requestId}</h1>

      {error && <p>{error}</p>}

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <h2 style={{ marginTop: 0 }}>Messages</h2>

        {messages.length === 0 && <p>No messages yet.</p>}

        {messages.map((m) => (
          <div key={m.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {m.sender_name ? m.sender_name : "Anonymous"}
              {m.created_at ? ` • ${new Date(m.created_at).toLocaleString()}` : ""}
            </div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1, padding: 8 }}
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
    }
