// app/request/[id]/page.tsx

"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";

type Message = {
  id: number;
  sender_id?: number;
  sender_name: string;
  body: string;
  created_at: string;
};

type Request = {
  id: number;
  title: string;
  status: string;
  customer_id: number;
  assigned_to?: number;
  customer_name?: string;
  runner_name?: string;
  offered_amount?: number;
  payment_method?: string;
  pickup_street?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_zip?: string;
  delivery_street?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  delivery_instructions?: string;
  merchant_name?: string;
  merchant_address?: string;
  merchant_hours?: string;
  pickup_flexibility?: string;
  created_at: string;
  // legacy
  pickup?: string;
  dropoff?: string;
};

function formatAddress(street?: string, city?: string, state?: string, zip?: string, fallback?: string) {
  if (street) return `${street}, ${city || ''} ${state || ''} ${zip || ''}`.trim();
  return fallback || null;
}

export default function RequestPage() {
  const params = useParams();
  const requestId = params.id as string;
  const { user, dbUserId, userRole, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [msgs, setMsgs] = useState<Message[]>([]);
  const [request, setRequest] = useState<Request | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isRunner = userRole === 'runner' || userRole === 'independent_driver';
  const isTerritoryOwner = userRole === 'territory_owner';

  const load = async () => {
    if (!requestId) return;
    try {
      const [msgsRes, reqsRes] = await Promise.all([
        fetch(`/.netlify/functions/messages-get?id=${requestId}`),
        fetch("/.netlify/functions/requests-get"),
      ]);
      if (msgsRes.ok) setMsgs(await msgsRes.json());
      if (reqsRes.ok) {
        const all = await reqsRes.json();
        const found = all.find((r: Request) => r.id === parseInt(requestId));
        setRequest(found || null);
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }
  };

  useEffect(() => {
    if (requestId) {
      load();
      const interval = setInterval(load, 8000);
      return () => clearInterval(interval);
    }
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    if (!text.trim() || !requestId) return;
    setSending(true);
    try {
      const res = await fetch("/.netlify/functions/messages-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: parseInt(requestId),
          body: text,
          sender_id: dbUserId || null,
          sender_name: user?.user_metadata?.full_name || user?.email || "Anonymous",
        }),
      });
      if (res.ok) {
        setText("");
        load();
      }
    } catch (e) {
      console.error("Failed to send:", e);
    }
    setSending(false);
  };

  const acceptRequest = async () => {
    if (!request) return;
    setAccepting(true);
    try {
      const res = await fetch("/.netlify/functions/requests-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: request.id, runner_id: dbUserId }),
      });
      if (res.ok) {
        load();
        alert("✅ Job accepted!");
      } else {
        alert("❌ Already accepted by someone else");
      }
    } catch (e) {
      alert("Failed to accept");
    }
    setAccepting(false);
  };

  const completeRequest = async () => {
    if (!request || !confirm("Mark this job as completed?")) return;
    setCompleting(true);
    try {
      await fetch("/.netlify/functions/requests-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: request.id }),
      });
      load();
    } catch (e) {
      console.error("Failed to complete:", e);
    }
    setCompleting(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const backUrl = isRunner ? '/runner' : isTerritoryOwner ? '/owner' : '/';

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

  const canAccept = request?.status === 'open' && (isRunner || isTerritoryOwner) && request?.assigned_to !== dbUserId;
  const canComplete = request?.status === 'accepted' && request?.assigned_to === dbUserId;
  const isAssigned = request?.assigned_to === dbUserId;
  const isCustomer = request?.customer_id === dbUserId;

  const pickupAddress = formatAddress(request?.pickup_street, request?.pickup_city, request?.pickup_state, request?.pickup_zip, request?.pickup);
  const deliveryAddress = formatAddress(request?.delivery_street, request?.delivery_city, request?.delivery_state, request?.delivery_zip, request?.dropoff);

  if (loading) return <div style={{padding: '40px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', color: '#888'}}>Loading...</div>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f0e8;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }
        .page { max-width: 640px; margin: 0 auto; padding: 24px 20px 180px; }
        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #2d4a2d; text-decoration: none; font-size: 0.88rem;
          font-weight: 500; margin-bottom: 20px; opacity: 0.65;
          cursor: pointer; background: none; border: none;
          transition: opacity 0.15s;
        }
        .back:hover { opacity: 1; }

        .req-card {
          background: #fff; border-radius: 16px; padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .req-top {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 14px; gap: 10px;
        }
        .req-title {
          font-family: 'Fraunces', serif; font-size: 1.2rem;
          color: #2d4a2d; font-weight: 600;
        }
        .status-pill {
          font-size: 0.75rem; font-weight: 600;
          padding: 4px 12px; border-radius: 100px; white-space: nowrap;
        }

        .address-block { margin-bottom: 12px; }
        .address-row { display: flex; gap: 10px; margin-bottom: 8px; }
        .address-row:last-child { margin-bottom: 0; }
        .address-icon { font-size: 1rem; flex-shrink: 0; margin-top: 2px; }
        .address-detail { flex: 1; }
        .address-label { font-size: 0.72rem; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .address-text { font-size: 0.88rem; color: #333; line-height: 1.4; }
        .address-sub { font-size: 0.78rem; color: '#888'; margin-top: 2px; }

        .instructions-box {
          background: #fff9e6; border: 1px solid #ffe9a0;
          border-radius: 8px; padding: 10px 14px;
          font-size: 0.85rem; color: #7a5c00; margin-bottom: 12px;
        }

        .meta-row {
          display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
        }
        .meta-tag {
          background: #f5f0e8; padding: 4px 10px;
          border-radius: 20px; font-size: 0.78rem; color: #666;
        }
        .meta-tag.green { background: #e8f5e9; color: #2d6a2d; }
        .meta-tag.amount {
          font-family: 'Fraunces', serif; font-size: 1rem;
          color: #2d4a2d; font-weight: 700; background: #f0f7f0;
        }

        .people-row {
          display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;
        }
        .person-tag {
          display: flex; align-items: center; gap: 6px;
          background: #f5f0e8; padding: 6px 12px; border-radius: 20px;
          font-size: 0.82rem; color: #2d4a2d;
        }

        .action-row {
          display: flex; gap: 8px; flex-wrap: wrap;
          padding-top: 12px; border-top: 1px solid #f0ebe0;
        }
        .btn {
          padding: 10px 18px; border-radius: 10px; border: none;
          font-size: 0.88rem; font-weight: 600; cursor: pointer;
          transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .btn-accept { background: #2d4a2d; color: #f5f0e8; }
        .btn-accept:hover { background: #3d6b3d; }
        .btn-complete { background: #7ab87a; color: #fff; }
        .btn-complete:hover { background: #5fa05f; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .messages {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 16px; min-height: 160px;
        }
        .msg-wrap { display: flex; flex-direction: column; max-width: 78%; }
        .msg-wrap.mine { align-self: flex-end; align-items: flex-end; }
        .msg-wrap.other { align-self: flex-start; align-items: flex-start; }
        .msg-name { font-size: 0.72rem; color: #aaa; margin-bottom: 3px; padding: 0 4px; }
        .msg-bubble {
          padding: 10px 14px; border-radius: 16px;
          font-size: 0.92rem; line-height: 1.45; word-break: break-word;
        }
        .msg-bubble.mine { background: #2d4a2d; color: #f5f0e8; border-bottom-right-radius: 4px; }
        .msg-bubble.other { background: #fff; color: #1a1a1a; box-shadow: 0 1px 4px rgba(0,0,0,0.07); border-bottom-left-radius: 4px; }
        .msg-time { font-size: 0.68rem; color: #ccc; margin-top: 3px; padding: 0 4px; }

        .empty-msgs { text-align: center; padding: 40px 20px; color: #bbb; font-size: 0.9rem; }
        .empty-msgs-icon { font-size: 2rem; margin-bottom: 8px; }

        .section-label {
          font-family: 'Fraunces', serif; font-size: 1rem;
          color: #2d4a2d; font-weight: 600; margin-bottom: 12px;
        }

        .compose {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(245,240,232,0.97);
          backdrop-filter: blur(12px);
          padding: 14px 20px 28px;
          border-top: 1px solid rgba(45,74,45,0.08);
        }
        .compose-inner {
          max-width: 640px; margin: 0 auto;
          display: flex; gap: 10px; align-items: flex-end;
        }
        .compose-input {
          flex: 1; padding: 12px 16px;
          border: 1.5px solid #e0d8cc; border-radius: 14px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #fff; color: #1a1a1a; outline: none;
          resize: none; max-height: 120px;
          transition: border-color 0.2s, box-shadow 0.2s; line-height: 1.4;
        }
        .compose-input:focus { border-color: #7ab87a; box-shadow: 0 0 0 3px rgba(122,184,122,0.15); }
        .compose-input::placeholder { color: #bbb; }
        .send-btn {
          width: 44px; height: 44px; background: #2d4a2d;
          color: #f5f0e8; border: none; border-radius: 12px;
          cursor: pointer; font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; flex-shrink: 0;
        }
        .send-btn:hover { background: #3d6b3d; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="page">
        <button className="back" onClick={() => router.push(backUrl)}>← Back</button>

        {request && (
          <div className="req-card">
            <div className="req-top">
              <div className="req-title">{request.title}</div>
              <span className="status-pill" style={{
                background: statusColor[request.status]?.bg || '#eee',
                color: statusColor[request.status]?.text || '#555'
              }}>
                {statusLabel[request.status] || request.status}
              </span>
            </div>

            {/* Addresses */}
            <div className="address-block">
              {(pickupAddress || request.merchant_name) && (
                <div className="address-row">
                  <div className="address-icon">📍</div>
                  <div className="address-detail">
                    <div className="address-label">Pickup{request.merchant_name ? ` — ${request.merchant_name}` : ''}</div>
                    {pickupAddress && <div className="address-text">{pickupAddress}</div>}
                    {request.merchant_hours && <div className="address-sub" style={{color:'#888',fontSize:'0.78rem'}}>🕐 {request.merchant_hours}</div>}
                  </div>
                </div>
              )}
              {deliveryAddress && (
                <div className="address-row">
                  <div className="address-icon">🏠</div>
                  <div className="address-detail">
                    <div className="address-label">Deliver to</div>
                    <div className="address-text">{deliveryAddress}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery instructions */}
            {request.delivery_instructions && (
              <div className="instructions-box">
                📝 <strong>Instructions:</strong> {request.delivery_instructions}
              </div>
            )}

            {/* Meta tags */}
            <div className="meta-row">
              {request.offered_amount && (
                <span className="meta-tag amount">${request.offered_amount}</span>
              )}
              {request.payment_method && (
                <span className="meta-tag green">💳 {request.payment_method}</span>
              )}
              {request.pickup_flexibility && (
                <span className="meta-tag">⏱ {request.pickup_flexibility}</span>
              )}
              <span className="meta-tag">📅 {new Date(request.created_at).toLocaleDateString()}</span>
            </div>

            {/* People */}
            <div className="people-row">
              {request.customer_name && (
                <span className="person-tag">👤 Customer: {request.customer_name}</span>
              )}
              {request.runner_name && (
                <span className="person-tag">🏃 Runner: {request.runner_name}</span>
              )}
            </div>

            {/* Action buttons */}
            {(canAccept || canComplete || isAdmin) && (
              <div className="action-row">
                {canAccept && (
                  <button className="btn btn-accept" onClick={acceptRequest} disabled={accepting}>
                    {accepting ? 'Accepting...' : '✅ Accept This Job'}
                  </button>
                )}
                {canComplete && (
                  <button className="btn btn-complete" onClick={completeRequest} disabled={completing}>
                    {completing ? 'Completing...' : '✅ Mark Complete'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat */}
        <div className="section-label">💬 Messages</div>
        <div className="messages">
          {msgs.length === 0 ? (
            <div className="empty-msgs">
              <div className="empty-msgs-icon">💬</div>
              No messages yet — start the conversation!
            </div>
          ) : (
            msgs.map(m => {
              const isMine = m.sender_id === dbUserId;
              return (
                <div key={m.id} className={`msg-wrap ${isMine ? "mine" : "other"}`}>
                  {!isMine && <div className="msg-name">{m.sender_name}</div>}
                  <div className={`msg-bubble ${isMine ? "mine" : "other"}`}>
                    {m.body}
                  </div>
                  <div className="msg-time">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="send-btn" onClick={send} disabled={sending || !text.trim()}>
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
