// app/driver/page.tsx - Driver dashboard

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
  customer_id: number;
  assigned_to?: number;
  customer_name?: string;
  offered_amount?: number;
  pickup_flexibility?: string;
  created_at: string;
  delivery_zip?: string;
};

export default function DriverDashboard() {
  const { user, dbUserId, loading } = useAuth();
  const router = useRouter();
  
  const [openRequests, setOpenRequests] = useState<Request[]>([]);
  const [myJobs, setMyJobs] = useState<Request[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Request[]>([]);
  const [tab, setTab] = useState<"available" | "myjobs" | "history">("available");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/.netlify/functions/requests-get");
      if (res.ok) {
        const all = await res.json();
        
        // Open requests in unclaimed territories (assigned_to is null) 
        // OR requests specifically assigned to me
        const open = all.filter((r: Request) => 
          r.status === 'open' && (!r.assigned_to || r.assigned_to === dbUserId)
        );
        setOpenRequests(open);
        
        // My active jobs (accepted but not completed)
        const mine = all.filter((r: Request) => 
          r.assigned_to === dbUserId && r.status === 'accepted'
        );
        setMyJobs(mine);
        
        // My completed deliveries
        const completed = all.filter((r: Request) => 
          r.assigned_to === dbUserId && r.status === 'completed'
        );
        setCompletedJobs(completed);
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (dbUserId) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [dbUserId]);

  const acceptRequest = async (requestId: number) => {
    try {
      const res = await fetch("/.netlify/functions/requests-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          request_id: requestId,
          driver_id: dbUserId 
        }),
      });

      if (res.ok) {
        loadData();
        alert("✅ Request accepted! Customer has been notified.");
      } else {
        alert("❌ Request already accepted by another driver");
      }
    } catch (e) {
      console.error("Accept failed:", e);
      alert("Failed to accept request");
    }
  };

  const completeRequest = async (requestId: number) => {
    if (!confirm("Mark this job as completed?")) return;
    
    await fetch("/.netlify/functions/requests-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId }),
    });
    
    loadData();
  };

  if (loading || loadingData) {
    return <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>;
  }

  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 800px; margin: 0 auto; padding: 32px 20px; }
        
        .header { margin-bottom: 32px; }
        .logo { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .subtitle { color: #888; font-size: 0.9rem; margin-top: 4px; }

        .stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-bottom: 24px;
        }
        .stat-card {
          background: #fff; padding: 16px; border-radius: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
        }
        .stat-label { font-size: 0.75rem; color: #999; margin-bottom: 4px; }
        .stat-value { font-family: 'Fraunces', serif; font-size: 1.5rem; color: #2d4a2d; font-weight: 700; }

        .tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e0d8cc; }
        .tab {
          padding: 12px 20px; background: none; border: none;
          font-size: 0.9rem; font-weight: 500; color: #666;
          cursor: pointer; border-bottom: 3px solid transparent;
          transition: all 0.2s; margin-bottom: -2px;
        }
        .tab.active { color: #2d4a2d; border-bottom-color: #7ab87a; }

        .card {
          background: #fff; border-radius: 14px; padding: 20px;
          margin-bottom: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          cursor: pointer; transition: all 0.2s;
        }
        .card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(45,74,45,0.1); }
        .card-title { font-weight: 600; font-size: 1rem; color: #1a1a1a; margin-bottom: 8px; }
        .card-meta { font-size: 0.85rem; color: #999; margin-bottom: 12px; }
        .card-route { font-size: 0.9rem; color: #555; margin-bottom: 12px; }
        
        .btn {
          padding: 8px 16px; border-radius: 10px; border: none;
          font-size: 0.85rem; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary { background: #2d4a2d; color: #f5f0e8; }
        .btn-primary:hover { background: #3d6b3d; }
        .btn-success { background: #7ab87a; color: #fff; }
        .btn-success:hover { background: #5fa05f; }
        .btn-secondary { background: #f5f0e8; color: #555; }
        .btn-secondary:hover { background: #e8e0d4; }

        .badge {
          display: inline-block; padding: 3px 10px; border-radius: 100px;
          font-size: 0.75rem; font-weight: 500; margin-left: 8px;
        }
        .badge-open { background: #d4f0d4; color: #2d6a2d; }
        .badge-accepted { background: #fdf3cc; color: #7a5c00; }
        .badge-completed { background: #e8e8e8; color: #555; }

        .empty { text-align: center; padding: 60px 20px; color: #bbb; }
        .empty-icon { font-size: 3rem; margin-bottom: 12px; }

        .actions { display: flex; gap: 8px; margin-top: 12px; }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="logo">errand<span>s</span></div>
          <div className="subtitle">Driver Dashboard</div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Available Jobs</div>
            <div className="stat-value">{openRequests.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">My Active Jobs</div>
            <div className="stat-value">{myJobs.filter(j => j.status === 'accepted').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{myJobs.filter(j => j.status === 'completed').length}</div>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${tab === "available" ? "active" : ""}`}
            onClick={() => setTab("available")}
          >
            Available Jobs ({openRequests.length})
          </button>
          <button 
            className={`tab ${tab === "myjobs" ? "active" : ""}`}
            onClick={() => setTab("myjobs")}
          >
            My Jobs ({myJobs.length})
          </button>
          <button 
            className={`tab ${tab === "history" ? "active" : ""}`}
            onClick={() => setTab("history")}
          >
            History ({completedJobs.length})
          </button>
        </div>

        {tab === "available" && (
          <>
            {openRequests.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📦</div>
                No available jobs right now. Check back soon!
              </div>
            ) : (
              openRequests.map(r => (
                <div key={r.id} className="card">
                  <div className="card-title">
                    {r.title}
                    <span className="badge badge-open">Open</span>
                  </div>
                  <div className="card-route">
                    📍 {r.pickup} → 🏠 {r.dropoff}
                  </div>
                  <div className="card-meta">
                    {r.offered_amount && `💰 $${r.offered_amount} • `}
                    {r.pickup_flexibility === 'asap' && 'ASAP • '}
                    Posted {new Date(r.created_at).toLocaleDateString()}
                    {r.delivery_zip && ` • ZIP: ${r.delivery_zip}`}
                  </div>
                  <div className="actions">
                    <button 
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptRequest(r.id);
                      }}
                    >
                      Accept Job
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/request/${r.id}`);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === "myjobs" && (
          <>
            {myJobs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                You haven't accepted any jobs yet
              </div>
            ) : (
              myJobs.map(r => (
                <div key={r.id} className="card" onClick={() => router.push(`/request/${r.id}`)}>
                  <div className="card-title">
                    {r.title}
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </div>
                  <div className="card-route">
                    📍 {r.pickup} → 🏠 {r.dropoff}
                  </div>
                  <div className="card-meta">
                    {r.offered_amount && `💰 $${r.offered_amount} • `}
                    {r.customer_name && `Customer: ${r.customer_name} • `}
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  {r.status === 'accepted' && (
                    <div className="actions">
                      <button 
                        className="btn btn-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          completeRequest(r.id);
                        }}
                      >
                        Mark Complete
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/request/${r.id}`);
                        }}
                      >
                        Chat
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {completedJobs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🚗</div>
                No completed deliveries yet
              </div>
            ) : (
              <>
                <div style={{
                  background: '#f0f7f0',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '4px'}}>
                      TOTAL DELIVERIES
                    </div>
                    <div style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      color: '#2d4a2d'
                    }}>
                      {completedJobs.length}
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '4px'}}>
                      TOTAL EARNED
                    </div>
                    <div style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      color: '#2d4a2d'
                    }}>
                      ${completedJobs.reduce((sum, j) => sum + (j.offered_amount || 0), 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '4px'}}>
                      AVG PER DELIVERY
                    </div>
                    <div style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      color: '#2d4a2d'
                    }}>
                      ${(completedJobs.reduce((sum, j) => sum + (j.offered_amount || 0), 0) / completedJobs.length).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                {completedJobs.map(r => (
                  <div key={r.id} className="card" onClick={() => router.push(`/request/${r.id}`)}>
                    <div className="card-title">
                      {r.title}
                      <span className="badge" style={{background: '#d4f0d4', color: '#2d6a2d'}}>
                        ✅ Completed
                      </span>
                    </div>
                    <div className="card-route">
                      📍 {r.pickup} → 🏠 {r.dropoff}
                    </div>
                    <div className="card-meta">
                      {r.customer_name && `👤 ${r.customer_name} • `}
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #f0f0f0',
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      color: '#2d4a2d'
                    }}>
                      + ${r.offered_amount?.toFixed(2) || '0.00'}
                    </div>
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
