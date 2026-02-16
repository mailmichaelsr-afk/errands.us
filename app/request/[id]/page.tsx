"use client";
import { useEffect, useRef, useState } from "react";

export default function RequestPage({ params }: any) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [request, setRequest] = useState<any>(null);
  const [text, setText] = useState("");
  const [senderName, setSenderName] = useState(
    typeof window !== "undefined" ? localStorage.getItem("senderName") || "" : ""
  );
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const [msgsRes, reqsRes] = await Promise.all([
      fetch(`/.netlify/functions/messages-get?id=${params.id}`),
      fetch("/.netlify/functions/requests-get"),
    ]);
    const messages = await msgsRes.json();
    const allRequests = await reqsRes.json();
    setMsgs(messages);
    setRequest(allRequests.find((r: any) => r.id == params.id) || null);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const saveName = (name: string) => {
    setSenderName(name);
    if (typeof window !== "undefined") localStorage.setItem("senderName", name);
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    await fetch("/.netlify/functions/messages-create", {
      method: "POST",
      body: JSON.stringify({
        request_id: params.id,
        body: text,
        sender_name: senderName || "Anonymous",
      }),
    });
    setText("");
    setSending(false);
    load();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const statusColor: Record<string, { bg: string; text: string }> = {
    open:      { bg: "#d4f0d4", text: "#2d6a2d" },
    accepted:  { bg: "#fdf3cc", text: "#7a5c00" },
    completed: { bg: "#e8e8e8", text: "#555" },
  };
  const statusLabel: Record<string, string> = {
    open: "🟢 Open",
    accepted: "🟡 In Progress",
    completed: "✅ Completed",
  };

  const s = request ? (statusColor[request.status] || { bg: "#eee", text: "#555" }) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f5f0e8;
          background-image:
            radial-gradient(circle at 70% 5%, rgba(255,200,120,0.12) 0%, transparent 45%),
            radial-gradient(circle at 20% 95%, rgba(134,193,134,0.1) 0%, transparent 45%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        .page { max-width: 640px; margin: 0 auto; padding: 28px 20px 120px; }

        .back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #2d4a2d;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          margin-bottom: 20px;
          opacity: 0.65;
          transition: opacity 0.15s;
        }
        .back:hover { opacity: 1; }

        /* Request info */
        .req-info {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .req-info-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .req-info h2 {
          font-family: 'Fraunces', serif;
          font-size: 1.2rem;
          color: #2d4a2d;
          font-weight: 600;
        }
        .status-pill {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 100px;
          white-space: nowrap;
        }
        .req-route {
          font-size: 0.85rem;
          color: #888;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Name input */
        .name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
          box-shadow: 0 1px 6px rgba(45,74,45,0.06);
        }
        .name-label {
          font-size: 0.83rem;
          color: #999;
          white-space: nowrap;
        }
        .name-input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          color: #2d2d2d;
          background: transparent;
        }
        .name-input::placeholder { color: #bbb; }

        /* Messages */
        .messages {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
          min-height: 200px;
        }

        .msg-wrap {
          display: flex;
          flex-direction: column;
          max-width: 75%;
        }
        .msg-wrap.mine { align-self: flex-end; align-items: flex-end; }
        .msg-wrap.other { align-self: flex-start; align-items: flex-start; }

        .msg-name {
          font-size: 0.72rem;
          color: #aaa;
          margin-bottom: 3px;
          padding: 0 4px;
        }

        .msg-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 0.92rem;
          line-height: 1.45;
          word-break: break-word;
        }
        .msg-bubble.mine {
          background: #2d4a2d;
          color: #f5f0e8;
          border-bottom-right-radius: 4px;
        }
        .msg-bubble.other {
          background: #fff;
          color: #1a1a1a;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          border-bottom-left-radius: 4px;
        }

        .empty-msgs {
          text-align: center;
          padding: 40px 20px;
          color: #bbb;
          font-size: 0.9rem;
        }
        .empty-msgs-icon { font-size: 2rem; margin-bottom: 8px; }

        /* Compose */
        .compose {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: rgba(245,240,232,0.95);
          backdrop-filter: blur(12px);
          padding: 14px 20px 24px;
          border-top: 1px solid rgba(45,74,45,0.08);
        }
        .compose-inner {
          max-width: 640px;
          margin: 0 auto;
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        .compose-input {
          flex: 1;
          padding: 12px 16px;
          border: 1.5px solid #e0d8cc;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.93rem;
          background: #fff;
          color: #1a1a1a;
          outline: none;
          resize: none;
          max-height: 120px;
          transition: border-color 0.2s, box-shadow 0.2s;
          line-height: 1.4;
        }
        .compose-input:focus {
          border-color: #7ab87a;
          box-shadow: 0 0 0 3px rgba(122,184,122,0.15);
        }
        .compose-input::placeholder { color: #bbb; }

        .send-btn {
          width: 44px; height: 44px;
          background: #2d4a2d;
          color: #f5f0e8;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, transform 0.1s;
          flex-shrink: 0;
        }
        .send-btn:hover:not(:disabled) { background: #3d6b3d; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="page">
        <a href="/" className="back">← All Requests</a>

        {request && (
          <div className="req-info">
            <div className="req-info-top">
              <h2>{request.title}</h2>
              {s && (
                <span className="status-pill" style={{ background: s.bg, color: s.text }}>
                  {statusLabel[request.status] || request.status}
                </span>
              )}
            </div>
            <div className="req-route">
              <span>📍 {request.pickup}</span>
              <span>→</span>
              <span>🏠 {request.dropoff}</span>
            </div>
          </div>
        )}

        <div className="name-row">
          <span className="name-label">Chatting as</span>
          <input
            className="name-input"
            placeholder="Enter your name…"
            value={senderName}
            onChange={(e) => saveName(e.target.value)}
          />
        </div>

        <div className="messages">
          {msgs.length === 0 ? (
            <div className="empty-msgs">
              <div className="empty-msgs-icon">💬</div>
              No messages yet — start the conversation!
            </div>
          ) : (
            msgs.map((m) => {
              const isMine = m.sender_name === senderName && senderName !== "";
              return (
                <div key={m.id} className={`msg-wrap ${isMine ? "mine" : "other"}`}>
                  {!isMine && <div className="msg-name">{m.sender_name}</div>}
                  <div className={`msg-bubble ${isMine ? "mine" : "other"}`}>
                    {m.body}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="compose">
        <div className="compose-inner">
          <textarea
            className="compose-input"
            rows={1}
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            className="send-btn"
            onClick={send}
            disabled={sending || !text.trim()}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
