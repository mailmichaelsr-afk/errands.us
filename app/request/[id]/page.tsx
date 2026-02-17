// app/request/[id]/page.tsx

"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";

type Message = {
  id: number;
  sender_id?: number;
  sender_name: string;
  body: string;
  photo_url?: string;
  created_at: string;
};

type Request = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
  customer_id?: number;
  assigned_to?: number;
  pickup_time?: string;
  delivery_time?: string;
  pickup_flexibility?: string;
  delivery_flexibility?: string;
  offered_amount?: number;
  tip_amount?: number;
  payment_method?: string;
  payment_notes?: string;
  receipt_photo_url?: string;
  delivery_photo_url?: string;
  delivery_confirmed_at?: string;
  created_at: string;
};

export default function RequestPage({ params }: any) {
  const { user, dbUserId, isCustomer, isTerritoryOwner } = useAuth();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [request, setRequest] = useState<Request | null>(null);
  const [text, setText] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // New states for enhanced features
  const [showTipForm, setShowTipForm] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const [msgsRes, reqsRes] = await Promise.all([
        fetch(`/.netlify/functions/messages-get?id=${params.id}`),
        fetch("/.netlify/functions/requests-get"),
      ]);
      const messages = await msgsRes.json();
      const allRequests = await reqsRes.json();
      setMsgs(messages);
      setRequest(allRequests.find((r: any) => r.id == params.id) || null);
    } catch (e) {
      console.error("Failed to load:", e);
    }
  };

  useEffect(() => { load(); }, [params.id]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setSenderName(user.user_metadata.full_name);
    } else if (typeof window !== "undefined") {
      const saved = localStorage.getItem("senderName");
      if (saved) setSenderName(saved);
    }
  }, [user]);

  const saveName = (name: string) => {
    setSenderName(name);
    if (typeof window !== "undefined") localStorage.setItem("senderName", name);
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch("/.netlify/functions/messages-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: params.id,
          body: text,
          sender_id: dbUserId,
          sender_name: senderName || "Anonymous",
        }),
      });
      setText("");
      load();
    } catch (e) {
      console.error("Failed to send:", e);
    }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, type: "receipt" | "delivery" | "chat") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (type === "chat") {
        // Send as message with photo
        await fetch("/.netlify/functions/messages-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_id: params.id,
            body: "📷 Photo",
            sender_id: dbUserId,
            sender_name: senderName || "Anonymous",
            photo_url: base64,
          }),
        });
      } else {
        // Upload receipt or delivery photo
        await fetch("/.netlify/functions/photos-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_id: params.id,
            photo_type: type,
            photo_data: base64,
            uploaded_by: dbUserId,
          }),
        });
      }
      
      load();
    } catch (e) {
      console.error("Failed to upload:", e);
    }
    setUploadingPhoto(false);
  };

  const confirmDelivery = async () => {
    try {
      await fetch("/.netlify/functions/requests-confirm-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id }),
      });
      load();
      setShowTipForm(true);
    } catch (e) {
      console.error("Failed to confirm delivery:", e);
    }
  };

  const addTip = async () => {
    if (!tipAmount) return;
    try {
      await fetch("/.netlify/functions/requests-add-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: params.id,
          tip_amount: parseFloat(tipAmount),
        }),
      });
      setShowTipForm(false);
      setTipAmount("");
      setShowRatingForm(true);
      load();
    } catch (e) {
      console.error("Failed to add tip:", e);
    }
  };

  const submitRating = async () => {
    if (rating === 0) return;
    try {
      await fetch("/.netlify/functions/ratings-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: params.id,
          from_user_id: dbUserId,
          to_user_id: request?.assigned_to || request?.customer_id,
          rating,
          review_text: reviewText,
        }),
      });
      setShowRatingForm(false);
      setRating(0);
      setReviewText("");
      load();
    } catch (e) {
      console.error("Failed to submit rating:", e);
    }
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
  const canUploadReceipt = isTerritoryOwner && request?.status === "accepted" && !request?.receipt_photo_url;
  const canUploadDelivery = isTerritoryOwner && request?.status === "accepted" && !request?.delivery_photo_url;
  const canConfirmDelivery = isCustomer && request?.status === "completed" && !request?.delivery_confirmed_at;
  const canAddTip = isCustomer && request?.delivery_confirmed_at && !request?.tip_amount;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f0e8;
          background-image:
            radial-gradient(circle at 70% 5%, rgba(255,200,120,0.12) 0%, transparent 45%),
            radial-gradient(circle at 20% 95%, rgba(134,193,134,0.1) 0%, transparent 45%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }
        .page { max-width: 640px; margin: 0 auto; padding: 28px 20px 180px; }
        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #2d4a2d; text-decoration: none; font-size: 0.88rem;
          font-weight: 500; margin-bottom: 20px; opacity: 0.65;
          transition: opacity 0.15s;
        }
        .back:hover { opacity: 1; }

        .req-info {
          background: #fff; border-radius: 16px; padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .req-info-top {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 8px;
        }
        .req-info h2 {
          font-family: 'Fraunces', serif; font-size: 1.2rem;
          color: #2d4a2d; font-weight: 600;
        }
        .status-pill {
          font-size: 0.75rem; font-weight: 500;
          padding: 4px 10px; border-radius: 100px; white-space: nowrap;
        }
        .req-route {
          font-size: 0.85rem; color: #888;
          display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
        }
        .req-details { font-size: 0.82rem; color: #666; line-height: 1.6; }
        .req-details strong { color: #2d4a2d; }

        .photos-section {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px; margin-top: 12px;
        }
        .photo-card {
          background: #faf8f4; border-radius: 10px; padding: 12px;
          border: 1.5px dashed #c8d8c8; text-align: center;
          cursor: pointer; transition: all 0.2s;
        }
        .photo-card:hover { border-color: #7ab87a; background: #f0f7f0; }
        .photo-card img { width: 100%; border-radius: 8px; margin-bottom: 8px; }
        .photo-label { font-size: 0.78rem; color: #999; }

        .name-row {
          display: flex; align-items: center; gap: 10px;
          background: #fff; border-radius: 12px;
          padding: 12px 16px; margin-bottom: 16px;
          box-shadow: 0 1px 6px rgba(45,74,45,0.06);
        }
        .name-label { font-size: 0.83rem; color: #999; white-space: nowrap; }
        .name-input {
          flex: 1; border: none; outline: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
          color: #2d2d2d; background: transparent;
        }
        .name-input::placeholder { color: #bbb; }

        .messages {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 16px; min-height: 200px;
        }
        .msg-wrap {
          display: flex; flex-direction: column; max-width: 75%;
        }
        .msg-wrap.mine { align-self: flex-end; align-items: flex-end; }
        .msg-wrap.other { align-self: flex-start; align-items: flex-start; }
        .msg-name {
          font-size: 0.72rem; color: #aaa;
          margin-bottom: 3px; padding: 0 4px;
        }
        .msg-bubble {
          padding: 10px 14px; border-radius: 16px;
          font-size: 0.92rem; line-height: 1.45; word-break: break-word;
        }
        .msg-bubble.mine {
          background: #2d4a2d; color: #f5f0e8;
          border-bottom-right-radius: 4px;
        }
        .msg-bubble.other {
          background: #fff; color: #1a1a1a;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          border-bottom-left-radius: 4px;
        }
        .msg-bubble img { max-width: 100%; border-radius: 8px; margin-top: 6px; }
        .empty-msgs {
          text-align: center; padding: 40px 20px;
          color: #bbb; font-size: 0.9rem;
        }
        .empty-msgs-icon { font-size: 2rem; margin-bottom: 8px; }

        .action-bar {
          background: #fff; border-radius: 14px; padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .action-bar-title { font-weight: 600; font-size: 0.9rem; color: #2d4a2d; margin-bottom: 10px; }
        .btn {
          padding: 10px 16px; border-radius: 10px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .btn-primary { background: #2d4a2d; color: #f5f0e8; }
        .btn-primary:hover { background: #3d6b3d; }
        .btn-success { background: #7ab87a; color: #fff; }
        .btn-success:hover { background: #5fa05f; }
        .input {
          display: block; width: 100%; padding: 11px 14px; margin-bottom: 10px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
        }
        .input:focus { border-color: #7ab87a; background: #fff; }

        .rating-stars {
          display: flex; gap: 8px; margin-bottom: 12px;
        }
        .star {
          font-size: 2rem; cursor: pointer; transition: all 0.2s;
          filter: grayscale(100%); opacity: 0.3;
        }
        .star.active { filter: none; opacity: 1; }

        .compose {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(245,240,232,0.95);
          backdrop-filter: blur(12px);
          padding: 14px 20px 24px;
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
          transition: border-color 0.2s, box-shadow 0.2s;
          line-height: 1.4;
        }
        .compose-input:focus {
          border-color: #7ab87a;
          box-shadow: 0 0 0 3px rgba(122,184,122,0.15);
        }
        .compose-input::placeholder { color: #bbb; }
        .icon-btn {
          width: 44px; height: 44px; background: #f5f0e8;
          color: #2d4a2d; border: none; border-radius: 12px;
          cursor: pointer; font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; flex-shrink: 0;
        }
        .icon-btn:hover { background: #e8e0d4; }
        .send-btn {
          background: #2d4a2d; color: #f5f0e8;
        }
        .send-btn:hover { background: #3d6b3d; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        input[type="file"] { display: none; }
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
            <div className="req-details">
              {request.pickup_time && <div><strong>Pickup:</strong> {new Date(request.pickup_time).toLocaleString()}</div>}
              {request.delivery_time && <div><strong>Delivery:</strong> {new Date(request.delivery_time).toLocaleString()}</div>}
              {request.offered_amount && <div><strong>Offer:</strong> ${request.offered_amount}</div>}
              {request.tip_amount && <div><strong>Tip:</strong> ${request.tip_amount}</div>}
              {request.payment_method && <div><strong>Payment:</strong> {request.payment_method}</div>}
              {request.payment_notes && <div><strong>Notes:</strong> {request.payment_notes}</div>}
            </div>

            {(request.receipt_photo_url || request.delivery_photo_url || canUploadReceipt || canUploadDelivery) && (
              <div className="photos-section">
                {request.receipt_photo_url ? (
                  <div className="photo-card">
                    <img src={request.receipt_photo_url} alt="Receipt" />
                    <div className="photo-label">Receipt</div>
                  </div>
                ) : canUploadReceipt && (
                  <div className="photo-card" onClick={() => document.getElementById('receipt-upload')?.click()}>
                    <div style={{fontSize:"2rem",marginBottom:8}}>📄</div>
                    <div className="photo-label">Upload Receipt</div>
                    <input
                      id="receipt-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => uploadPhoto(e, "receipt")}
                    />
                  </div>
                )}

                {request.delivery_photo_url ? (
                  <div className="photo-card">
                    <img src={request.delivery_photo_url} alt="Delivery" />
                    <div className="photo-label">Delivered</div>
                  </div>
                ) : canUploadDelivery && (
                  <div className="photo-card" onClick={() => document.getElementById('delivery-upload')?.click()}>
                    <div style={{fontSize:"2rem",marginBottom:8}}>📦</div>
                    <div className="photo-label">Upload Delivery Photo</div>
                    <input
                      id="delivery-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => uploadPhoto(e, "delivery")}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {canConfirmDelivery && (
          <div className="action-bar">
            <div className="action-bar-title">Confirm delivery received</div>
            <button className="btn btn-success" onClick={confirmDelivery}>
              ✅ Confirm Delivery
            </button>
          </div>
        )}

        {showTipForm && (
          <div className="action-bar">
            <div className="action-bar-title">Add a tip (optional)</div>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Tip amount"
              value={tipAmount}
              onChange={e => setTipAmount(e.target.value)}
            />
            <button className="btn btn-primary" onClick={addTip}>
              Add Tip
            </button>
            <button className="btn" style={{background:"#f5f0e8",color:"#666",marginTop:8}} onClick={() => {setShowTipForm(false); setShowRatingForm(true);}}>
              Skip
            </button>
          </div>
        )}

        {showRatingForm && (
          <div className="action-bar">
            <div className="action-bar-title">Rate your experience</div>
            <div className="rating-stars">
              {[1,2,3,4,5].map(n => (
                <span
                  key={n}
                  className={`star ${rating >= n ? "active" : ""}`}
                  onClick={() => setRating(n)}
                >
                  ⭐
                </span>
              ))}
            </div>
            <textarea
              className="input"
              placeholder="Write a review (optional)"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={3}
            />
            <button className="btn btn-primary" onClick={submitRating} disabled={rating === 0}>
              Submit Rating
            </button>
          </div>
        )}

        <div className="name-row">
          <span className="name-label">Chatting as</span>
          <input
            className="name-input"
            placeholder="Enter your name…"
            value={senderName}
            onChange={e => saveName(e.target.value)}
          />
        </div>

        <div className="messages">
          {msgs.length === 0 ? (
            <div className="empty-msgs">
              <div className="empty-msgs-icon">💬</div>
              No messages yet — start the conversation!
            </div>
          ) : (
            msgs.map(m => {
              const isMine = m.sender_id === dbUserId || (m.sender_name === senderName && senderName !== "");
              return (
                <div key={m.id} className={`msg-wrap ${isMine ? "mine" : "other"}`}>
                  {!isMine && <div className="msg-name">{m.sender_name}</div>}
                  <div className={`msg-bubble ${isMine ? "mine" : "other"}`}>
                    {m.body}
                    {m.photo_url && <img src={m.photo_url} alt="Attached" />}
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
          <button
            className="icon-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
          >
            📷
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => uploadPhoto(e, "chat")}
          />
          <textarea
            className="compose-input"
            rows={1}
            placeholder="Type a message…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            className="icon-btn send-btn"
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
