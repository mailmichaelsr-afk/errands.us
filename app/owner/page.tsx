// app/owner/page.tsx - With messaging

"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Request = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
  pickup_time?: string;
  delivery_time?: string;
  pickup_flexibility?: string;
  delivery_flexibility?: string;
  offered_amount?: number;
  payment_method?: string;
  customer_name?: string;
  route_order?: number;
  created_at: string;
};

export default function OwnerDashboard() {
  const { user, isTerritoryOwner, dbUserId, loading } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<"list" | "calendar" | "route" | "messages">("list");
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingData, setLoadingData] = useState(true);
  const [territory, setTerritory] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  // Messaging
  const [adminId, setAdminId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && (!user || !isTerritoryOwner)) {
      router.replace("/login");
    }
  }, [user, isTerritoryOwner, loading]);

  const loadData = async () => {
    if (!dbUserId) return;
    setLoadingData(true);
    try {
      const [reqRes, terrRes, statsRes] = await Promise.all([
        fetch(`/.netlify/functions/requests-get-by-owner?owner_id=${dbUserId}`),
        fetch(`/.netlify/functions/territory-get-by-owner?owner_id=${dbUserId}`),
        fetch(`/.netlify/functions/territory-stats-get?owner_id=${dbUserId}`),
      ]);
      if (reqRes.ok) setRequests(await reqRes.json());
      if (terrRes.ok) setTerritory(await terrRes.json());
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(Array.isArray(statsData) ? statsData[0] : statsData);
      }

      // Get admin user ID
      const adminRes = await fetch('/.netlify/functions/users-get?role=admin');
      if (adminRes.ok) {
        const admins = await adminRes.json();
        if (admins.length > 0) setAdminId(admins[0].id);
      }
    } catch (e) {
      console.error("Failed to load owner data:", e);
    }
    setLoadingData(false);
  };

  const loadMessages = async () => {
    if (!dbUserId || !adminId) return;
    const res = await fetch(`/.netlify/functions/direct-messages-get?user_id=${dbUserId}&other_user_id=${adminId}`);
    if (res.ok) {
      const msgs = await res.json();
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const loadUnread = async () => {
    if (!dbUserId) return;
    const res = await fetch(`/.netlify/functions/direct-messages-unread?user_id=${dbUserId}`);
    if (res.ok) {
      const data = await res.json();
      setUnreadCount(data.unread || 0);
    }
  };

  useEffect(() => {
    if (isTerritoryOwner && dbUserId) loadData();
  }, [isTerritoryOwner, dbUserId]);

  useEffect(() => {
    if (adminId && dbUserId) {
      loadUnread();
      const interval = setInterval(loadUnread, 15000);
      return () => clearInterval(interval);
    }
  }, [adminId, dbUserId]);

  useEffect(() => {
    if (view === 'messages' && adminId) {
      loadMessages();
      const interval = setInterval(loadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [view, adminId]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !dbUserId || !adminId) return;
    await fetch('/.netlify/functions/direct-messages-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_user_id: dbUserId, to_user_id: adminId, body: messageInput.trim() })
    });
    setMessageInput("");
    loadMessages();
  };

  const accept = async (id: number) => {
    await fetch("/.netlify/functions/requests-accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, runner_id: dbUserId }),
    });
    loadData();
  };

  const complete = async (id: number) => {
    await fetch("/.netlify/functions/requests-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const openInGoogleMaps = () => {
    if (todaysRoute.length === 0) return;
    const origin = encodeURIComponent(todaysRoute[0].pickup);
    const destination = encodeURIComponent(todaysRoute[todaysRoute.length - 1].dropoff);
    const waypointList = todaysRoute.flatMap(r => [
      encodeURIComponent(r.pickup), encodeURIComponent(r.dropoff)
    ]).filter((v, i, arr) => arr.indexOf(v) === i).slice(1, -1);
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypointList.join('|')}&travelmode=driving`, '_blank');
  };

  if (loading || !isTerritoryOwner) return null;

  const openRequests = requests.filter(r => r.status === "open");
  const acceptedRequests = requests.filter(r => r.status === "accepted");
  const scheduledForDate = requests.filter(r =>
    r.pickup_time?.startsWith(selectedDate) || r.delivery_time?.startsWith(selectedDate)
  );
  const todaysRoute = acceptedRequests
    .filter(r => (r.pickup_time && r.pickup_time.startsWith(new Date().toISOString().split('T')[0])) || r.pickup_flexibility === 'asap')
    .sort((a, b) => (a.route_order || 999) - (b.route_order || 999));
  const totalEarnings = requests.filter(r => r.status === "completed" && r.offered_amount).reduce((sum, r) => sum + (r.offered_amount || 0), 0);
  const routeEarnings = todaysRoute.reduce((sum, r) => sum + (r.offered_amount || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 1000px; margin: 0 auto; padding: 28px 16px 80px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .logo { font-family: 'Fraunces', serif; font-size: 1.7rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .user-badge { background: #2d4a2d; color: #f5f0e8; padding: 7px 14px; border-radius: 100px; font-size: 0.82rem; font-weight: 500; }
        .quick-links { display: flex; gap: 12px; margin-bottom: 24px; }
        .quick-link { flex: 1; padding: 14px 20px; background: #fff; border: 1.5px solid #e0d8cc; border-radius: 12px; text-align: center; text-decoration: none; color: #2d4a2d; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
        .quick-link:hover { border-color: #7ab87a; background: #f0f7f0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .stat-card { background: #fff; padding: 16px; border-radius: 12px; box-shadow: 0 2px 10px rgba(45,74,45,0.06); }
        .stat-label { font-size: 0.78rem; color: #999; margin-bottom: 5px; }
        .stat-value { font-family: 'Fraunces', serif; font-size: 1.6rem; color: #2d4a2d; font-weight: 700; }
        .stat-meta { font-size: 0.7rem; color: #999; margin-top: 4px; }
        .view-tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e0d8cc; overflow-x: auto; }
        .view-tab { padding: 10px 18px; background: none; border: none; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500; color: #666; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; margin-bottom: -2px; white-space: nowrap; position: relative; }
        .view-tab.active { color: #2d4a2d; border-bottom-color: #7ab87a; }
        .unread-dot { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: #e53e3e; border-radius: 50%; }
        .section-head { font-family: 'Fraunces', serif; font-size: 1.15rem; color: #2d4a2d; margin: 24px 0 12px; }
        .req-card { background: #fff; border-radius: 14px; padding: 16px; margin-bottom: 10px; box-shadow: 0 2px 10px rgba(45,74,45,0.06); }
        .req-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 12px; }
        .req-title { font-weight: 600; font-size: 0.95rem; color: #1a1a1a; }
        .req-meta { font-size: 0.82rem; color: #999; margin-bottom: 8px; }
        .req-route { font-size: 0.85rem; color: #666; margin-bottom: 10px; }
        .req-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn { padding: 8px 14px; border-radius: 9px; border: none; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .btn-accept { background: #2d4a2d; color: #f5f0e8; }
        .btn-complete { background: #7ab87a; color: #fff; }
        .btn-view { background: #f5f0e8; color: #2d4a2d; }
        .badge { display: inline-block; padding: 3px 9px; border-radius: 100px; font-size: 0.73rem; font-weight: 500; }
        .badge-open { background: #d4f0d4; color: #2d6a2d; }
        .badge-accepted { background: #fdf3cc; color: #7a5c00; }
        .badge-completed { background: #e8e8e8; color: #555; }
        .route-item { background: #fff; border-radius: 12px; padding: 14px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(45,74,45,0.06); display: flex; align-items: center; gap: 12px; }
        .route-number { width: 32px; height: 32px; border-radius: 50%; background: #2d4a2d; color: #f5f0e8; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
        .route-details { flex: 1; }
        .route-title { font-weight: 500; font-size: 0.9rem; color: #1a1a1a; margin-bottom: 3px; }
        .route-addr { font-size: 0.8rem; color: #999; }
        .nav-card { background: #fff; border-radius: 14px; padding: 18px; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(45,74,45,0.07); }
        .nav-title { font-weight: 600; font-size: 1rem; color: #2d4a2d; margin-bottom: 14px; }
        .nav-btn-wide { width: 100%; padding: 12px 16px; border-radius: 10px; border: none; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
        .empty { text-align: center; padding: 40px; color: #bbb; font-size: 0.9rem; }
        .empty-icon { font-size: 2.2rem; margin-bottom: 8px; }
        .messages-wrap { display: flex; flex-direction: column; height: 60vh; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(45,74,45,0.06); }
        .messages-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .messages-input { padding: 12px 16px; border-top: 1px solid #f0f0f0; display: flex; gap: 8px; }
        .messages-input input { flex: 1; padding: 10px 14px; border: 1.5px solid #e0d8cc; border-radius: 20px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; background: #faf8f4; color: #1a1a1a; }
        .messages-input button { background: #2d4a2d; color: #f5f0e8; border: none; border-radius: 20px; padding: 10px 18px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.88rem; }
      `}</style>

      <div className="page">
        <div className="header">
          <div>
            <div className="logo">errand<span>s</span></div>
            <div style={{color: "#999", fontSize: "0.88rem", marginTop: 4}}>
              {territory?.name || "Your Territory"}
            </div>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <button className="btn btn-view" onClick={() => router.push('/')}>← Home</button>
            <div className="user-badge">👤 {user?.user_metadata?.full_name || user?.email}</div>
          </div>
        </div>

        <div className="quick-links">
          <a href="/owner/merchants" className="quick-link">🏪 Manage My Merchants</a>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">This Month</div>
            <div className="stat-value">{stats?.requests_this_month || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open Now</div>
            <div className="stat-value">{stats?.open_requests || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Earnings (30d)</div>
            <div className="stat-value">${(stats?.earnings_last_30_days || 0).toFixed(0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rating</div>
            <div className="stat-value">{stats?.avg_rating ? `⭐ ${stats.avg_rating.toFixed(1)}` : '—'}</div>
          </div>
        </div>

        <div className="view-tabs">
          <button className={`view-tab ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>📋 List</button>
          <button className={`view-tab ${view === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>📅 Calendar</button>
          <button className={`view-tab ${view === "route" ? "active" : ""}`} onClick={() => setView("route")}>🗺️ Today's Route</button>
          <button className={`view-tab ${view === "messages" ? "active" : ""}`} onClick={() => setView("messages")}>
            💬 Messages
            {unreadCount > 0 && <span className="unread-dot" />}
          </button>
        </div>

        {view === "list" && (
          <>
            {openRequests.length > 0 && (
              <>
                <div className="section-head">Available to Accept</div>
                {openRequests.map(r => (
                  <div key={r.id} className="req-card">
                    <div className="req-top">
                      <div className="req-title">{r.title}</div>
                      <span className="badge badge-open">Open</span>
                    </div>
                    <div className="req-meta">{r.customer_name && `${r.customer_name} • `}{r.offered_amount && `$${r.offered_amount} • `}{r.payment_method}</div>
                    <div className="req-route">📍 {r.pickup} → 🏠 {r.dropoff}</div>
                    <div className="req-actions">
                      <button className="btn btn-accept" onClick={() => accept(r.id)}>✋ Accept</button>
                      <button className="btn btn-view" onClick={() => router.push(`/request/${r.id}`)}>💬 Details</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {acceptedRequests.length > 0 && (
              <>
                <div className="section-head">In Progress</div>
                {acceptedRequests.map(r => (
                  <div key={r.id} className="req-card">
                    <div className="req-top">
                      <div className="req-title">{r.title}</div>
                      <span className="badge badge-accepted">Accepted</span>
                    </div>
                    <div className="req-meta">{r.customer_name && `${r.customer_name} • `}{r.offered_amount && `$${r.offered_amount}`}</div>
                    <div className="req-route">📍 {r.pickup} → 🏠 {r.dropoff}</div>
                    <div className="req-actions">
                      <button className="btn btn-complete" onClick={() => complete(r.id)}>✅ Complete</button>
                      <button className="btn btn-view" onClick={() => router.push(`/request/${r.id}`)}>💬 Details</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {openRequests.length === 0 && acceptedRequests.length === 0 && (
              <div className="empty"><div className="empty-icon">🌿</div>No active requests right now</div>
            )}
          </>
        )}

        {view === "calendar" && (
          <>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              style={{padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e0d8cc", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", marginBottom: "20px", color: '#1a1a1a'}} />
            {scheduledForDate.length === 0 ? (
              <div className="empty"><div className="empty-icon">📅</div>No requests scheduled for this date</div>
            ) : scheduledForDate.map(r => (
              <div key={r.id} className="req-card">
                <div className="req-top">
                  <div className="req-title">{r.title}</div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
                <div className="req-route">📍 {r.pickup} → 🏠 {r.dropoff}</div>
                <div className="req-actions">
                  {r.status === "open" && <button className="btn btn-accept" onClick={() => accept(r.id)}>Accept</button>}
                  {r.status === "accepted" && <button className="btn btn-complete" onClick={() => complete(r.id)}>Complete</button>}
                  <button className="btn btn-view" onClick={() => router.push(`/request/${r.id}`)}>Details</button>
                </div>
              </div>
            ))}
          </>
        )}

        {view === "route" && (
          <>
            {todaysRoute.length === 0 ? (
              <div className="empty"><div className="empty-icon">🗺️</div>No route planned for today</div>
            ) : (
              <>
                <div className="nav-card">
                  <div className="nav-title">Navigation ({todaysRoute.length} stops • ${routeEarnings.toFixed(2)})</div>
                  <button className="nav-btn-wide" style={{background: '#4285f4', color: '#fff'}} onClick={openInGoogleMaps}>🗺️ Open in Google Maps</button>
                </div>
                <div className="section-head">Your Stops</div>
                {todaysRoute.map((r, idx) => (
                  <div key={r.id} className="route-item">
                    <div className="route-number">{idx + 1}</div>
                    <div className="route-details">
                      <div className="route-title">{r.title}</div>
                      <div className="route-addr">📍 {r.pickup} → 🏠 {r.dropoff}</div>
                    </div>
                    <button className="btn btn-view" onClick={() => router.push(`/request/${r.id}`)}>View</button>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {view === "messages" && (
          <>
            <div style={{marginBottom: '12px'}}>
              <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.1rem', color: '#2d4a2d', fontWeight: 700}}>
                💬 Messages from Errands.us
              </div>
              <div style={{fontSize: '0.82rem', color: '#999', marginTop: '4px'}}>
                Direct line to your territory manager
              </div>
            </div>
            <div className="messages-wrap">
              <div className="messages-body">
                {messages.length === 0 ? (
                  <div style={{textAlign: 'center', color: '#bbb', padding: '30px', fontSize: '0.88rem'}}>
                    No messages yet. You can send a message to your territory manager here.
                  </div>
                ) : messages.map(m => {
                  const isMe = m.from_user_id === dbUserId;
                  return (
                    <div key={m.id} style={{display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start'}}>
                      <div style={{
                        background: isMe ? '#2d4a2d' : '#f5f0e8',
                        color: isMe ? '#f5f0e8' : '#1a1a1a',
                        padding: '10px 14px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        maxWidth: '75%', fontSize: '0.88rem', lineHeight: 1.5,
                      }}>
                        {m.body}
                      </div>
                      <div style={{fontSize: '0.72rem', color: '#aaa', marginTop: '3px'}}>
                        {isMe ? 'You' : 'Errands.us'} · {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="messages-input">
                <input
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
