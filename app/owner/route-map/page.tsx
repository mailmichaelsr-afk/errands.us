// app/owner/route-map/page.tsx

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Request = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  route_order?: number;
  offered_amount?: number;
};

export default function RouteMap() {
  const { user, isTerritoryOwner, dbUserId, loading } = useAuth();
  const router = useRouter();
  
  const [requests, setRequests] = useState<Request[]>([]);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isTerritoryOwner)) {
      router.replace("/login");
    }
  }, [user, isTerritoryOwner, loading]);

  const loadRequests = async () => {
    if (!dbUserId) return;
    try {
      const res = await fetch(`/.netlify/functions/requests-get-by-owner?owner_id=${dbUserId}`);
      if (res.ok) {
        const data = await res.json();
        const accepted = data
          .filter((r: any) => r.status === "accepted")
          .sort((a: any, b: any) => (a.route_order || 999) - (b.route_order || 999));
        setRequests(accepted);
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }
  };

  useEffect(() => {
    if (isTerritoryOwner && dbUserId) loadRequests();
  }, [isTerritoryOwner, dbUserId]);

  const openInGoogleMaps = () => {
    if (requests.length === 0) return;

    // Build waypoints string for Google Maps
    const waypoints = requests.map(r => {
      return `${encodeURIComponent(r.pickup)}/${encodeURIComponent(r.dropoff)}`;
    }).join('/');

    // Google Maps multi-stop route URL
    const origin = encodeURIComponent(requests[0].pickup);
    const destination = encodeURIComponent(requests[requests.length - 1].dropoff);
    
    // Build waypoints for intermediate stops
    const waypointList = requests.slice(0, -1).flatMap(r => [
      encodeURIComponent(r.dropoff)
    ]).concat(
      requests.slice(1).map(r => encodeURIComponent(r.pickup))
    ).filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypointList.join('|')}&travelmode=driving`;
    
    window.open(mapsUrl, '_blank');
  };

  const openInAppleMaps = () => {
    if (requests.length === 0) return;

    // Apple Maps only supports simple directions, so we'll open to first stop
    const destination = encodeURIComponent(`${requests[0].pickup}, ${requests[0].dropoff}`);
    const mapsUrl = `http://maps.apple.com/?daddr=${destination}`;
    
    window.open(mapsUrl, '_blank');
  };

  const openInWaze = () => {
    if (requests.length === 0) return;

    // Waze supports navigate to first stop
    const destination = encodeURIComponent(requests[0].pickup);
    const wazeUrl = `https://waze.com/ul?q=${destination}&navigate=yes`;
    
    window.open(wazeUrl, '_blank');
  };

  const optimizeRoute = async () => {
    setOptimizing(true);
    try {
      // Call Google Maps Distance Matrix API to get optimal order
      // For now, simple optimization by grouping nearby addresses
      
      // This is a placeholder - you'd need Google Maps API key for real optimization
      alert("Route optimization requires Google Maps API integration. For now, manually drag to reorder stops in the main dashboard.");
      
    } catch (e) {
      console.error("Optimization failed:", e);
    }
    setOptimizing(false);
  };

  if (loading || !isTerritoryOwner) return null;

  const totalEarnings = requests.reduce((sum, r) => sum + (r.offered_amount || 0), 0);

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
        .page { max-width: 640px; margin: 0 auto; padding: 28px 16px 80px; }
        
        .header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px;
        }
        .logo { font-family: 'Fraunces', serif; font-size: 1.7rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #2d4a2d; text-decoration: none; font-size: 0.88rem;
          font-weight: 500; opacity: 0.65; transition: opacity 0.15s;
        }
        .back:hover { opacity: 1; }

        .card {
          background: #fff; border-radius: 16px; padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .card-title { font-family: 'Fraunces', serif; font-size: 1.2rem; color: #2d4a2d; margin-bottom: 12px; }
        
        .stats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;
        }
        .stat { text-align: center; }
        .stat-label { font-size: 0.8rem; color: #999; margin-bottom: 4px; }
        .stat-value { font-family: 'Fraunces', serif; font-size: 1.6rem; color: #2d4a2d; font-weight: 700; }

        .stop-list { margin: 20px 0; }
        .stop {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px; background: #faf8f4; border-radius: 12px;
          margin-bottom: 10px;
        }
        .stop-number {
          width: 32px; height: 32px; border-radius: 50%;
          background: #2d4a2d; color: #f5f0e8;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
        }
        .stop-details { flex: 1; min-width: 0; }
        .stop-title { font-weight: 600; font-size: 0.9rem; color: #2d4a2d; margin-bottom: 4px; }
        .stop-addr { font-size: 0.82rem; color: #666; margin-bottom: 2px; }
        .stop-amount { font-size: 0.78rem; color: #7ab87a; font-weight: 500; }

        .nav-buttons {
          display: flex; flex-direction: column; gap: 10px;
        }
        .btn {
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-primary { background: #2d4a2d; color: #f5f0e8; }
        .btn-primary:hover { background: #3d6b3d; }
        .btn-google { background: #4285f4; color: #fff; }
        .btn-google:hover { background: #3367d6; }
        .btn-apple { background: #000; color: #fff; }
        .btn-apple:hover { background: #333; }
        .btn-waze { background: #33ccff; color: #fff; }
        .btn-waze:hover { background: #00b8e6; }
        .btn-secondary { background: #f5f0e8; color: #2d4a2d; border: 1.5px solid #e0d8cc; }
        .btn-secondary:hover { background: #e8e0d4; }

        .empty { text-align: center; padding: 40px 20px; color: #bbb; font-size: 0.9rem; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
      `}</style>

      <div className="page">
        <a href="/owner" className="back">← Back to Dashboard</a>

        <div className="header">
          <div className="logo">Today's Route</div>
        </div>

        {requests.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">🗺️</div>
              No accepted requests yet.<br />
              Accept some requests to build your route!
            </div>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="stats">
                <div className="stat">
                  <div className="stat-label">Total Stops</div>
                  <div className="stat-value">{requests.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Potential Earnings</div>
                  <div className="stat-value">${totalEarnings.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Your Stops</div>
              <div className="stop-list">
                {requests.map((r, idx) => (
                  <div key={r.id} className="stop">
                    <div className="stop-number">{idx + 1}</div>
                    <div className="stop-details">
                      <div className="stop-title">{r.title}</div>
                      <div className="stop-addr">📍 Pick up: {r.pickup}</div>
                      <div className="stop-addr">🏠 Drop off: {r.dropoff}</div>
                      {r.offered_amount && (
                        <div className="stop-amount">${r.offered_amount}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Navigation</div>
              <div className="nav-buttons">
                <button className="btn btn-google" onClick={openInGoogleMaps}>
                  🗺️ Open in Google Maps
                </button>
                <button className="btn btn-apple" onClick={openInAppleMaps}>
                  🍎 Open in Apple Maps
                </button>
                <button className="btn btn-waze" onClick={openInWaze}>
                  🚗 Open in Waze
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={optimizeRoute}
                  disabled={optimizing}
                >
                  ⚡ Optimize Route Order
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
