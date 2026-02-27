// app/page.tsx (with chat indicators and better communication UX)

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Request = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
  customer_id?: number;
  assigned_to?: number;
  offered_amount?: number;
  pickup_flexibility?: string;
  created_at: string;
  message_count?: number;
  last_message?: string;
};

export default function Home() {
  const { user, dbUserId, isTerritoryOwner, isCustomer, loading } = useAuth();
  const router = useRouter();
  
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupFlexibility, setPickupFlexibility] = useState("flexible");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryFlexibility, setDeliveryFlexibility] = useState("flexible");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [offeredAmount, setOfferedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const load = async () => {
    try {
      const res = await fetch("/.netlify/functions/requests-get");
      if (res.ok) {
        const data = await res.json();
        
        // Load message counts for each request
        const requestsWithMessages = await Promise.all(
          data.map(async (req: Request) => {
            try {
              const msgRes = await fetch(`/.netlify/functions/messages-get?id=${req.id}`);
              if (msgRes.ok) {
                const messages = await msgRes.json();
                return {
                  ...req,
                  message_count: messages.length,
                  last_message: messages.length > 0 ? messages[messages.length - 1].body : null
                };
              }
            } catch (e) {
              console.error(`Failed to load messages for request ${req.id}:`, e);
            }
            return req;
          })
        );
        
        setAllRequests(requestsWithMessages);
        
        // Filter to show only user's requests if customer
        if (dbUserId) {
          const mine = requestsWithMessages.filter((r: Request) => r.customer_id === dbUserId);
          setMyRequests(mine);
        }
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }
  };

  useEffect(() => {
    if (user) {
      load();
      // Refresh every 10 seconds to check for new messages
      const interval = setInterval(load, 10000);
      return () => clearInterval(interval);
    }
  }, [user, dbUserId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pickup || !dropoff) return;

    setSubmitting(true);
    try {
      const res = await fetch("/.netlify/functions/requests-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          pickup, 
          dropoff,
          customer_id: dbUserId,
          pickup_time: pickupTime || null,
          pickup_flexibility: pickupFlexibility,
          delivery_time: deliveryTime || null,
          delivery_flexibility: deliveryFlexibility,
          offered_amount: offeredAmount ? parseFloat(offeredAmount) : null,
          payment_method: paymentMethod,
          payment_notes: paymentNotes || null,
        }),
      });

      if (res.ok) {
        const newRequest = await res.json();
        
        // Clear form
        setTitle("");
        setPickup("");
        setDropoff("");
        setPickupTime("");
        setDeliveryTime("");
        setOfferedAmount("");
        setPaymentNotes("");
        setShowDetails(false);
        setShowForm(false);
        
        // Reload
        await load();
        
        // Show success and open the request
        if (confirm("✅ Request posted! Click OK to view and chat with your territory owner.")) {
          router.push(`/request/${newRequest.id}`);
        }
      } else {
        alert("❌ Failed to post request. Please try again.");
      }
    } catch (e) {
      console.error("Submit failed:", e);
      alert("❌ Failed to post request. Please try again.");
    }
    setSubmitting(false);
  };

  // Show nothing while checking auth
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f0e8",
        fontFamily: "'DM Sans', sans-serif"
      }}>
        Loading...
      </div>
    );
  }

  // Don't render anything if not logged in (will redirect)
  if (!user) return null;

  const displayRequests = isTerritoryOwner ? allRequests : myRequests;

  // Get status display info
  const getStatusInfo = (status: string) => {
    const info: Record<string, { label: string; color: string; bg: string }> = {
      open: { label: "🟢 Open", color: "#2d6a2d", bg: "#d4f0d4" },
      accepted: { label: "👤 Accepted", color: "#7a5c00", bg: "#fdf3cc" },
      completed: { label: "✅ Done", color: "#555", bg: "#e8e8e8" },
    };
    return info[status] || { label: status, color: "#555", bg: "#eee" };
  };

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
        .page { max-width: 640px; margin: 0 auto; padding: 28px 20px 80px; }
        .hero {
          text-align: center; margin-bottom: 32px;
        }
        .logo { font-family: 'Fraunces', serif; font-size: 2.2rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .tagline {
          font-size: 0.95rem; color: #888; margin-top: 6px;
        }

        .nav-links {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .nav-link {
          flex: 1;
          padding: 10px;
          background: #fff;
          border: 1.5px solid #e0d8cc;
          border-radius: 10px;
          text-align: center;
          text-decoration: none;
          color: #2d4a2d;
          font-size: 0.88rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .nav-link:hover {
          border-color: #7ab87a;
          background: #f0f7f0;
        }

        .card {
          background: #fff; border-radius: 16px; padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .card-title {
          font-family: 'Fraunces', serif; font-size: 1.2rem;
          color: #2d4a2d; margin-bottom: 16px; font-weight: 600;
        }
        .form-group { margin-bottom: 14px; }
        .label {
          display: block; font-size: 0.88rem; color: #555;
          font-weight: 500; margin-bottom: 6px;
        }
        .input, .select {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .input:focus, .select:focus {
          border-color: #7ab87a;
          background: #fff;
        }
        .input::placeholder { color: #bbb; }
        .textarea {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          min-height: 80px; resize: vertical;
        }
        .textarea:focus {
          border-color: #7ab87a;
          background: #fff;
        }
        
        .radio-group {
          display: flex; gap: 12px; flex-wrap: wrap;
        }
        .radio-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.88rem; color: #555; cursor: pointer;
        }
        
        .toggle-details {
          background: #f5f0e8; border: 1.5px dashed #e0d8cc;
          padding: 12px; border-radius: 10px; text-align: center;
          cursor: pointer; font-size: 0.88rem; color: #666;
          transition: all 0.2s; margin-bottom: 14px;
        }
        .toggle-details:hover {
          background: #e8e0d4; border-color: #7ab87a;
        }
        
        .btn {
          width: 100%; padding: 13px; border-radius: 12px;
          border: none; background: #2d4a2d; color: #f5f0e8;
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
          font-weight: 500; cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .btn:hover { background: #3d6b3d; }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .btn-outline {
          background: #fff; color: #2d4a2d;
          border: 1.5px solid #2d4a2d;
        }
        .btn-outline:hover {
          background: #2d4a2d; color: #f5f0e8;
        }

        .req-list { display: flex; flex-direction: column; gap: 12px; }
        .req-item {
          background: #faf8f4; padding: 16px; border-radius: 12px;
          border: 1px solid #e8e0d4;
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
        }
        .req-item:hover {
          background: #fff;
          box-shadow: 0 4px 12px rgba(45,74,45,0.08);
          transform: translateY(-2px);
        }
        .req-item.has-messages {
          border-left: 3px solid #7ab87a;
        }
        .req-top {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 6px; gap: 8px;
        }
        .req-title { font-weight: 600; font-size: 0.95rem; color: #2d4a2d; flex: 1; }
        .req-status {
          font-size: 0.75rem; padding: 3px 8px; border-radius: 100px;
          white-space: nowrap;
        }
        .req-route { font-size: 0.85rem; color: #888; margin-bottom: 6px; }
        .req-meta { font-size: 0.8rem; color: #999; margin-bottom: 8px; }
        
        .req-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 8px; border-top: 1px solid #e8e0d4;
        }
        .message-indicator {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.8rem; color: #7ab87a; font-weight: 500;
        }
        .message-badge {
          background: #7ab87a; color: #fff;
          width: 20px; height: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 600;
        }
        .last-message {
          font-size: 0.78rem; color: #999;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 200px;
        }
        .chat-btn {
          background: #2d4a2d; color: #f5f0e8;
          padding: 6px 12px; border-radius: 8px;
          font-size: 0.8rem; border: none;
          cursor: pointer; transition: all 0.2s;
        }
        .chat-btn:hover {
          background: #3d6b3d;
        }
        
        .empty { text-align: center; padding: 40px 20px; color: #bbb; font-size: 0.9rem; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }

        .user-info {
          text-align: center;
          padding: 12px;
          background: #fff;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 0.88rem;
          color: #666;
        }
        
        .post-btn-wrapper {
          margin-bottom: 24px;
        }

        .tip-box {
          background: #f0f7f0;
          border: 1.5px solid #7ab87a;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 20px;
          font-size: 0.88rem;
          color: #2d4a2d;
          line-height: 1.5;
        }
        .tip-icon {
          font-size: 1.2rem;
          margin-right: 6px;
        }
      `}</style>

      <div className="page">
        <div className="hero">
          <div className="logo">errand<span>s</span></div>
          <div className="tagline">Your neighborhood helping hands</div>
        </div>

        <div className="user-info">
          👤 {user?.user_metadata?.full_name || user?.email}
        </div>

        <div className="nav-links">
          <a href="/directory" className="nav-link">🏪 Merchants</a>
          {isTerritoryOwner && <a href="/owner" className="nav-link">📊 Dashboard</a>}
        </div>

        {!showForm ? (
          <div className="post-btn-wrapper">
            <button className="btn" onClick={() => setShowForm(true)}>
              + Post a Request
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="card-title">Post a Request</div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="label">What do you need?</label>
                <input
                  className="input"
                  placeholder="e.g. Pick up prescription from CVS"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Pickup from</label>
                <input
                  className="input"
                  placeholder="Store name or address with zip code"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Deliver to</label>
                <input
                  className="input"
                  placeholder="Your address"
                  value={dropoff}
                  onChange={e => setDropoff(e.target.value)}
                  required
                />
              </div>

              <div 
                className="toggle-details" 
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "▼" : "▶"} Add timing, cost & payment details
              </div>

              {showDetails && (
                <>
                  <div className="form-group">
                    <label className="label">Pickup timing</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="pickupFlex" 
                          value="asap"
                          checked={pickupFlexibility === "asap"}
                          onChange={e => setPickupFlexibility(e.target.value)}
                        />
                        ASAP
                      </label>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="pickupFlex" 
                          value="flexible"
                          checked={pickupFlexibility === "flexible"}
                          onChange={e => setPickupFlexibility(e.target.value)}
                        />
                        Flexible
                      </label>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="pickupFlex" 
                          value="scheduled"
                          checked={pickupFlexibility === "scheduled"}
                          onChange={e => setPickupFlexibility(e.target.value)}
                        />
                        Scheduled
                      </label>
                    </div>
                  </div>

                  {pickupFlexibility === "scheduled" && (
                    <div className="form-group">
                      <label className="label">Pickup time</label>
                      <input
                        className="input"
                        type="datetime-local"
                        value={pickupTime}
                        onChange={e => setPickupTime(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">Delivery timing</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="deliveryFlex" 
                          value="asap"
                          checked={deliveryFlexibility === "asap"}
                          onChange={e => setDeliveryFlexibility(e.target.value)}
                        />
                        ASAP
                      </label>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="deliveryFlex" 
                          value="flexible"
                          checked={deliveryFlexibility === "flexible"}
                          onChange={e => setDeliveryFlexibility(e.target.value)}
                        />
                        Flexible
                      </label>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="deliveryFlex" 
                          value="scheduled"
                          checked={deliveryFlexibility === "scheduled"}
                          onChange={e => setDeliveryFlexibility(e.target.value)}
                        />
                        By specific time
                      </label>
                    </div>
                  </div>

                  {deliveryFlexibility === "scheduled" && (
                    <div className="form-group">
                      <label className="label">Deliver by</label>
                      <input
                        className="input"
                        type="datetime-local"
                        value={deliveryTime}
                        onChange={e => setDeliveryTime(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">How much will you pay?</label>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      placeholder="15.00"
                      value={offeredAmount}
                      onChange={e => setOfferedAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Payment method</label>
                    <select 
                      className="select"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      <option>Cash</option>
                      <option>Venmo</option>
                      <option>Zelle</option>
                      <option>PayPal</option>
                      <option>CashApp</option>
                      <option>Apple Pay</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Payment notes (optional)</label>
                    <textarea
                      className="textarea"
                      placeholder="e.g. Venmo @username, or any special instructions"
                      value={paymentNotes}
                      onChange={e => setPaymentNotes(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn" disabled={submitting} style={{flex: 1}}>
                  {submitting ? "Posting..." : "Post Request"}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowForm(false)}
                  style={{flex: 1}}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isCustomer && myRequests.length > 0 && (
          <div className="tip-box">
            <span className="tip-icon">💬</span>
            <strong>Click any request to chat with your territory owner!</strong> They'll get notified and can answer questions or send updates.
          </div>
        )}

        <div className="card">
          <div className="card-title">
            {isCustomer ? "My Requests" : "All Requests"}
          </div>
          {displayRequests.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📦</div>
              {isCustomer ? "You haven't posted any requests yet." : "No requests yet."}
            </div>
          ) : (
            <div className="req-list">
              {displayRequests.slice(0, 20).map(r => {
                const statusInfo = getStatusInfo(r.status);
                const hasMessages = (r.message_count || 0) > 0;
                
                return (
                  <div
                    key={r.id}
                    className={`req-item ${hasMessages ? 'has-messages' : ''}`}
                    onClick={() => router.push(`/request/${r.id}`)}
                  >
                    <div className="req-top">
                      <div className="req-title">{r.title}</div>
                      <div 
                        className="req-status" 
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </div>
                    </div>
                    <div className="req-route">
                      📍 {r.pickup} → 🏠 {r.dropoff}
                    </div>
                    <div className="req-meta">
                      {r.offered_amount && `$${r.offered_amount} • `}
                      {r.pickup_flexibility === 'asap' && 'ASAP • '}
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="req-footer">
                      <div className="message-indicator">
                        {hasMessages ? (
                          <>
                            <div className="message-badge">{r.message_count}</div>
                            <span>💬 {r.message_count} message{r.message_count !== 1 ? 's' : ''}</span>
                          </>
                        ) : (
                          <span style={{color: "#999"}}>No messages yet</span>
                        )}
                      </div>
                      <button 
                        className="chat-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/request/${r.id}`);
                        }}
                      >
                        💬 Chat
                      </button>
                    </div>
                    
                    {r.last_message && (
                      <div className="last-message">
                        Last: {r.last_message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
