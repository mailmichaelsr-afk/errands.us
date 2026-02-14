// app/request/[id]/page.tsx

"use client";
import { useEffect, useState } from "react";

type Msg = {
  id: number;
  request_id: number;
  sender_name: string;
  body: string;
  created_at?: string;
};

export default function RequestPage({ params }: { params: { id: string } }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("Anonymous");

  const load = async () => {
    const res = await fetch(`/.netlify/functions/messages-get?request_id=${params.id}`);
    setMsgs(await res.json());
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    await fetch("/.netlify/functions/messages-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: Number(params.id), sender_name: name, body: text }),
    });
    setText("");
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      <a href="/">← Back</a>
      <h2>Conversation #{params.id}</h2>

      {msgs.map((m) => (
        <div key={m.id}>
          <b>{m.sender_name}:</b> {m.body}
        </div>
      ))}

      <hr />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      <br />
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" />
      <button onClick={send}>Send</button>
    </div>
  );
}
