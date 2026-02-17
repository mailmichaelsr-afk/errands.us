// app/owner/page.tsx (with integrated navigation)

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
  
  const [view, setView] = useState<"list" | "calendar" | "route">("list");
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingData, setLoadingData] = useState(true);
  const [territory, setTerritory] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!user || !isTerritoryOwner)) {
      router.replace("/login");
    }
  }, [user, isTerritoryOwner, loading]);

  const loadData = async () => {
    if (!dbUserId) return;
    setLoadingData(true);
    try {
      const [reqRes, terrRes] = await Promise.all([
        fetch(`/.netlify/functions/requests-get-by-owner?owner_id=${dbUserId}`),
        fetch(`/.netlify/functions/territory-get-by-owner?owner_id=${dbUserId}`),
      ]);
      if (reqRes.ok) setRequests(await reqRes.json());
      if (terrRes.ok) setTerritory(await terrRes.json());
    } catch (e) {
      console.error("Failed to load owner data:", e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (isTerritoryOwner && dbUserId) loadData();
  }, [isTerritoryOwner, dbUserId]);

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
      encodeURIComponent(r.pickup),
      encodeURIComponent(r.dropoff)
    ]).filter((v, i, arr) => arr.indexOf(v) === i).slice(1, -1);

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypointList.join('|')}&travelmode=driving`;
    
    window.open(mapsUrl, '_blank');
  };

  const openInAppleMaps = () => {
    if (todaysRoute.length === 0) return;
    const destination = encodeURIComponent(todaysRoute[0].pickup);
    window.open(`http://maps.apple.com/?daddr=${destination}`, '_blank');
  };

  const openInWaze = () => {
    if (todaysRoute.length === 0) return;
    const destination = encodeURIComponent(todaysRoute[0].pickup);
    window.open(`https://waze.com/ul?q=${destination}&navigate=yes`, '_blank');
  };

  if (loading || !isTerritoryOwner) return null;

  const openRequests = requests.filter(r => r.status === "open");
  const acceptedRequests = requests.filter(r => r.status === "accepted");
  const completedToday = requests.filter(r => 
    r.status === "completed" && 
    r.created_at?.startsWith(new Date().toISOString().split('T')[0])
  );

  const scheduledForDate = requests.filter(r => 
    r.pickup_time?.startsWith(selectedDate) || r.delivery_time?.startsWith(selectedDate)
  );

  const todaysRoute = acceptedRequests
    .filter(r => 
      (r.pickup_time && r.pickup_time.startsWith(new Date().toISOString().split('T')[0])) ||
      r.pickup_flexibility === 'asap'
    )
    .sort((a, b) => (a.route_order || 999) - (b.route_order || 999));

  const totalEarnings = requests
    .filter(r => r.status === "completed" && r.offered_amount)
    .reduce((sum, r) => sum + (r.offered_amount || 0), 0);

  const routeEarnings = todaysRoute.reduce((sum, r) => sum + (r.offered_amount || 0), 0);

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
        .page { max-width: 1000px; margin: 0 auto; padding: 28px 16px 80px; }
        
        .header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
        }
        .logo { font-family: 'Fraunces', serif; font-size: 1.7rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .user-badge {
          background: #2d4a2d; color: #f5f0e8;
          padding: 7px 14px; border-radius: 100px;
          font-size: 0.82rem; font-weight: 500;
        }

        .stats {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px; margin-bottom: 24px;
        }
        .stat-card {
          background: #fff; padding: 16px; border-radius: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .stat-label { font-size: 0.78rem; color: #999; margin-bottom: 5px; }
        .stat-value { font-family: 'Fraunces', serif; font-size: 1.6rem; color: #2d4a2d; font-weight: 700; }

        .view-tabs {
          display: flex; gap: 8px; margin-bottom: 20px;
          border-bottom: 2px solid #e0d8cc;
        }
        .view-tab {
          padding: 10px 18px; background: none; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
          font-weight: 500; color: #666; cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s; margin-bottom: -2px;
        }
        .view-tab.active { color: #2d4a2d; border-bottom-color: #7ab87a; }
        .view-tab:hover:not(.active) { color: #2d4a2d; }

        .section-head {
          font-family: 'Fraunces', serif; font-size: 1.15rem;
          color: #2d4a2d; margin: 24px 0 12px;
        }

        .req-card {
          background: #fff; border-radius: 14px; padding: 16px;
          margin-bottom: 10px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .req-top {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 8px; gap: 12px;
        }
        .req-title { font-weight: 600; font-size: 0.95rem; color: #1a1a1a; }
        .req-meta { font-size: 0.82rem; color: #999; margin-bottom: 8px; }
        .req-route { font-size: 0.85rem; color: #666; margin-bottom: 10px; }
        .req-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .btn {
          padding: 8px 14px; border-radius: 9px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .btn-accept { background: #2d4a2d; color: #f5f0e8; }
        .btn-accept:hover { background: #3d6b3d; }
        .btn-complete { background: #7ab87a; color: #fff; }
        .btn-complete:hover { background: #5fa05f; }
        .btn-view { background: #f5f0e8; color: #2d4a2d; }
        .btn-view:hover { background: #e8e0d4; }
        .btn-google { background: #4285f4; color: #fff; }
        .btn-google:hover { background: #3367d6; }
        .btn-apple { background: #000; color: #fff; padding: 10px 16px; }
        .btn-apple:hover { background: #333; }
        .btn-waze { background: #33ccff; color: #fff; }
        .btn-waze:hover { background: #00b8e6; }

        .badge {
          display: inline-block; padding: 3px 9px; border-radius: 100px;
          font-size: 0.73rem; font-weight: 500;
        }
        .badge-open { background: #d4f0d4; color: #2d6a2d; }
        .badge-accepted { background: #fdf3cc; color: #7a5c00; }
        .badge-completed { background: #e8e8e8; color: #555; }

        .route-item {
          background: #fff; border-radius: 12px; padding: 14px;
          margin-bottom: 8px;
          box-shadow: 0 2px 8px rgba(45,74,45,0.06);
          display: flex; align-items: center; gap: 12px;
        }
        .route-number {
          width: 32px; height: 32px; border-radius: 50%;
          background: #2d4a2d; color: #f5f0e8;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
        }
        .route-details { flex: 1; min-width: 0; }
        .route-title { font-weight: 500; font-size: 0.9rem; color: #1a1a1a; margin-bottom: 3px; }
        .route-addr { font-size: 0.8rem; color: #999; }

        .nav-card {
          background: #fff; border-radius: 14px; padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .nav-title { font-weight: 600; font-size: 1rem; color: #2d4a2d; margin-bottom: 14px; }
        .nav-buttons { display: flex; flex-direction: column; gap: 8px; }
        .nav-btn-wide {
          width: 100%; padding: 12px 16px; border-radius: 10px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        
        .empty { text-align: center; padding: 40px; color: #bbb; font-size: 0.9rem; }
        .empty-icon { font-size: 2.2rem; margin-bottom: 8px; }
      `}</style>

      <div className="page">
        <div className="header">
          <div>
            <div className="logo">errand<span>s</span></div>
            <div style={{ color: "#999", fontSize: "0.88rem", marginTop: 4 }}>
              {territory?.name || "Your Territory"}
            </div>
          </div>
          <div className="user-badge">
            👤 {user?.user_metadata?.full_name || user?.email}
          </div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Open Requests</div>
            <div className="stat-value">{openRequests.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{acceptedRequests.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Done Today</div>
            <div className="stat-value">{completedToday.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Earnings</div>
            <div className="stat-value">${totalEarnings.toFixed(2)}</div>
          </div>
        </div>

        <div className="view-tabs">
          <button
            className={`view-tab ${view === "list" ? "active" : ""}`}
            onClick={() => setView("list")}
          >
            📋 List
          </button>
          <button
            className={`view-tab ${view === "calendar" ? "active" : ""}`}
            onClick={() => setView("calendar")}
          >
            📅 Calendar
          </button>
          <button
            className={`view-tab ${view === "route" ? "active" : ""}`}
            onClick={() => setView("route")}
          >
            🗺️ Today's Route
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
                    <div className="req-meta">
                      {r.customer_name && `${r.customer_name} • `}
                      {r.offered_amount && `$${r.offered_amount} • `}
                      {r.payment_method}
                    </div>
                    <div className="req-route">
                      📍 {r.pickup} → 🏠 {r.dropoff}
                    </div>
                    <div className="req-actions">
                      <button className="btn btn-accept" onClick={() => accept(r.id)}>
                        ✋ Accept
                      </button>
                      <button className="btn btn-view" onClick={() => router.push(`/request/${r.id}`)}>
                        💬 Details
                      </button>
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
                    <div className="req-meta">
                      {r.customer_name && `${r.customer_name} • `}
                      {r.offered_amount && `$${r.offered_amount}`}
                    </div>
                    <div className="req-route">
                      📍 {r.pickup} → 🏠 {r.dropoff}
                    </div>
                    <div className="req-actions">
                      <button className="btn btn-complete" onClick={() => complete(r.id)}>
                        ✅ Complete
                      </button>
                      <button className="btn btn-view" onClick={() => router.push(`/request/${r.id}`)}>
                        💬 Details
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {openRequests.length === 0 && acceptedRequests.length === 0 && (
              <div className="empty">
                <div className="empty-icon">🌿</div>
                No active requests right now
              </div>
            )}
          </>
        )}

        {view === "calendar" && (
          <>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid #e0d8cc",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9rem",
                marginBottom: "20px",
              }}
            />

            {scheduledForDate.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📅</div>
                No requests scheduled for this date
              </div>
            ) : (
              scheduledForDate.map(r => (
                <div key={r.id} className="req-card">
                  <div className="req-top">
                    <div className="req-title">{r.title}</div>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </div>
                  <div className="req-meta">
                    {r.pickup_time && `Pickup: ${new Date(r.pickup_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                    {r.delivery_time && ` • Deliver by: ${new Date(r.delivery_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                  </div>
                  <div className="req-route">
                    📍 {r.pickup} → 🏠 {r.dropoff}
                  </div>
                  <div className="req-actions">
                    {r.status === "open" && (
                      <button className="btn btn-accept" onClick={() => accept(r.id)}>Accept</button>
                    )}
                    {r.status === "accepted" && (
                      <button className="btn btn-complete" onClick={() => complete(r.id)}>Complete</button>
                    )}
                    <button className="btn btn-view" onClick={() => router.push(`/request/${r.id}`)}>
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {view === "route" && (
          <>
            {todaysRoute.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🗺️</div>
                No route planned for today
              </div>
            ) : (
              <>
                <div className="nav-card">
                  <div className="nav-title">Navigation ({todaysRoute.length} stops • ${routeEarnings.toFixed(2)})</div>
                  <div className="nav-buttons">
                    <button className="nav-btn-wide btn-google" onClick={openInGoogleMaps}>
                      🗺️ Open in Google Maps
                    </button>
                    <button className="nav-btn-wide btn-apple" onClick={openInAppleMaps}>
                      🍎 Open in Apple Maps
                    </button>
                    <button className="nav-btn-wide btn-waze" onClick={openInWaze}>
                      🚗 Open in Waze
                    </button>
                  </div>
                </div>

                <div className="section-head">Your Stops</div>
                {todaysRoute.map((r, idx) => (
                  <div key={r.id} className="route-item">
                    <div className="route-number">{idx + 1}</div>
                    <div className="route-details">
                      <div className="route-title">{r.title}</div>
                      <div className="route-addr">📍 {r.pickup} → 🏠 {r.dropoff}</div>
                    </div>
                    <button
                      className="btn btn-view"
                      onClick={() => router.push(`/request/${r.id}`)}
                    >
                      View
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
