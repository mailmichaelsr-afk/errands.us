// app/runner/page.tsx - Runner dashboard with notifications

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

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

export default function RunnerDashboard() {
  const { user, dbUserId, loading } = useAuth();
  const router = useRouter();
  
  const [openRequests, setOpenRequests] = useState<Request[]>([]);
  const [myJobs, setMyJobs] = useState<Request[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Request[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [tab, setTab] = useState<"available" | "myjobs" | "history" | "merchants">("available");
  const [loadingData, setLoadingData] = useState(true);
  
  // Merchant form state
  const [userZip, setUserZip] = useState("");
  const [canAddMerchants, setCanAddMerchants] = useState(true);
  const [showMerchantForm, setShowMerchantForm] = useState(false);
  const [merchantName, setMerchantName] = useState("");
  const [merchantCategory, setMerchantCategory] = useState("grocery");
  const [merchantAddress, setMerchantAddress] = useState("");
  const [merchantZip, setMerchantZip] = useState("");
  const [merchantPhone, setMerchantPhone] = useState("");
  const [merchantHours, setMerchantHours] = useState("");
  const [merchantWebsite, setMerchantWebsite] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const userRes = await fetch(`/.netlify/functions/users-get?id=${dbUserId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserZip(userData.zip || "");
        setCanAddMerchants(userData.can_add_merchants !== false);
        
        if (userData.zip) {
          const merchRes = await fetch(
            `/.netlify/functions/merchants-get-for-user?user_id=${dbUserId}&zip=${userData.zip}`
          );
          if (merchRes.ok) {
            setMerchants(await merchRes.json());
          }
        }
      }
      
      const res = await fetch("/.netlify/functions/requests-get");
      if (res.ok) {
        const all = await res.json();
        const open = all.filter((r: Request) => 
          r.status === 'open' && (!r.assigned_to || r.assigned_to === dbUserId)
        );
        setOpenRequests(open);
        const mine = all.filter((r: Request) => 
          r.assigned_to === dbUserId && r.status === 'accepted'
        );
        setMyJobs(mine);
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
        body: JSON.stringify({ request_id: requestId, runner_id: dbUserId }),
      });
      if (res.ok) {
        loadData();
        alert("✅ Request accepted! Customer has been notified.");
      } else {
        alert("❌ Request already accepted by another runner");
      }
    } catch (e) {
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

  const openMerchantForm = () => {
    setMerchantName(""); setMerchantCategory("grocery"); setMerchantAddress("");
    setMerchantZip(userZip); setMerchantPhone(""); setMerchantHours(""); setMerchantWebsite("");
    setShowMerchantForm(true);
  };

  const saveMerchant = async () => {
    if (!merchantName || !merchantCategory || !merchantZip) {
      alert("Name, category, and ZIP are required");
      return;
    }
    try {
      const res = await fetch("/.netlify/functions/merchants-create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: dbUserId, name: merchantName, category: merchantCategory,
          address: merchantAddress, zip: merchantZip, phone: merchantPhone,
          hours: merchantHours, website: merchantWebsite, user_zip: userZip,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(`Failed: ${error.error}`);
        return;
      }
      setShowMerchantForm(false);
      loadData();
      const isPersonal = merchantZip !== userZip;
      alert(isPersonal
        ? `✅ Added to your personal list`
        : `✅ Added! Everyone in ZIP ${merchantZip} can see it.`
      );
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const hideMerchant = async (merchantId: number, merchantName: string) => {
    if (!confirm(`Remove "${merchantName}"? (Won't delete for others)`)) return;
    await fetch("/.netlify/functions/merchants-hide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: dbUserId, merchant_id: merchantId }),
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
        
        .header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 32px;
        }
        .header-left {}
        .logo { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .subtitle { color: #888; font-size: 0.9rem; margin-top: 4px; }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .back-btn {
          background: #f5f0e8; border: 1.5px solid #e0d8cc;
          padding: 8px 14px; border-radius: 8px; cursor: pointer;
          font-size: 0.85rem; color: #2d4a2d; font-weight: 500;
        }
        .back-btn:hover { background: #e8e0d4; }

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

        .tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e0d8cc; overflow-x: auto; }
        .tab {
          padding: 12px 20px; background: none; border: none;
          font-size: 0.9rem; font-weight: 500; color: #666;
          cursor: pointer; border-bottom: 3px solid transparent;
          transition: all 0.2s; margin-bottom: -2px; white-space: nowrap;
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
        .btn-danger { background: #dc3545; color: #fff; }
        .btn-danger:hover { background: #c82333; }
        .btn-small { padding: 4px 8px; font-size: 0.75rem; }

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

        .form-input {
          width: 100%; padding: 10px 12px; margin-bottom: 12px;
          border: 1.5px solid #e0d8cc; border-radius: 8px;
          font-size: 0.9rem; font-family: 'DM Sans', sans-serif;
          background: #faf8f4; outline: none;
        }
        .form-input:focus { border-color: #7ab87a; background: #fff; }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="header-left">
            <div className="logo">errand<span>s</span></div>
            <div className="subtitle">Runner Dashboard</div>
          </div>
          <div className="header-right">
            {dbUserId && (
              <NotificationBell userId={dbUserId} role="runner" />
            )}
            <button className="back-btn" onClick={() => router.push('/')}>
              ← Home
            </button>
          </div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Available Jobs</div>
            <div className="stat-value">{openRequests.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">My Active Jobs</div>
            <div className="stat-value">{myJobs.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{completedJobs.length}</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "available" ? "active" : ""}`} onClick={() => setTab("available")}>
            Available ({openRequests.length})
          </button>
          <button className={`tab ${tab === "myjobs" ? "active" : ""}`} onClick={() => setTab("myjobs")}>
            My Jobs ({myJobs.length})
          </button>
          <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            History ({completedJobs.length})
          </button>
          <button className={`tab ${tab === "merchants" ? "active" : ""}`} onClick={() => setTab("merchants")}>
            Merchants ({merchants.length})
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
                    <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); acceptRequest(r.id); }}>
                      Accept Job
                    </button>
                    <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); router.push(`/request/${r.id}`); }}>
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
                  <div className="card-route">📍 {r.pickup} → 🏠 {r.dropoff}</div>
                  <div className="card-meta">
                    {r.offered_amount && `💰 $${r.offered_amount} • `}
                    {r.customer_name && `Customer: ${r.customer_name} • `}
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  {r.status === 'accepted' && (
                    <div className="actions">
                      <button className="btn btn-success" onClick={(e) => { e.stopPropagation(); completeRequest(r.id); }}>
                        Mark Complete
                      </button>
                      <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); router.push(`/request/${r.id}`); }}>
                        💬 Chat
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
                <div className="empty-icon">📖</div>
                No completed deliveries yet
              </div>
            ) : (
              <>
                <div style={{
                  background: '#f0f7f0', padding: '16px', borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px'
                }}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '4px'}}>TOTAL DELIVERIES</div>
                    <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.8rem', fontWeight: 700, color: '#2d4a2d'}}>
                      {completedJobs.length}
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '4px'}}>TOTAL EARNED</div>
                    <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.8rem', fontWeight: 700, color: '#2d4a2d'}}>
                      ${completedJobs.reduce((sum, j) => sum + (j.offered_amount || 0), 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '4px'}}>AVG PER DELIVERY</div>
                    <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.8rem', fontWeight: 700, color: '#2d4a2d'}}>
                      ${(completedJobs.reduce((sum, j) => sum + (j.offered_amount || 0), 0) / completedJobs.length).toFixed(2)}
                    </div>
                  </div>
                </div>
                {completedJobs.map(r => (
                  <div key={r.id} className="card" onClick={() => router.push(`/request/${r.id}`)}>
                    <div className="card-title">
                      {r.title}
                      <span className="badge" style={{background: '#d4f0d4', color: '#2d6a2d'}}>✅ Completed</span>
                    </div>
                    <div className="card-route">📍 {r.pickup} → 🏠 {r.dropoff}</div>
                    <div className="card-meta">
                      {r.customer_name && `👤 ${r.customer_name} • `}
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                    <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0', fontSize: '1.2rem', fontWeight: 600, color: '#2d4a2d'}}>
                      + ${r.offered_amount?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {tab === "merchants" && (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <div style={{fontSize: '1.1rem', fontWeight: 600, color: '#2d4a2d'}}>My Merchant List</div>
              {canAddMerchants && (
                <button className="btn btn-primary" onClick={openMerchantForm}>+ Add Merchant</button>
              )}
            </div>

            {!canAddMerchants && (
              <div style={{background: '#fff3cd', border: '1px solid #ffc107', color: '#856404', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem'}}>
                ⚠️ You cannot add merchants. Contact support if this is an error.
              </div>
            )}

            {showMerchantForm && (
              <div style={{background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(45,74,45,0.1)'}}>
                <div style={{fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#2d4a2d'}}>Add Merchant</div>
                <input className="form-input" placeholder="Business Name *" value={merchantName} onChange={e => setMerchantName(e.target.value)} />
                <select className="form-input" value={merchantCategory} onChange={e => setMerchantCategory(e.target.value)}>
                  <option value="grocery">grocery</option>
                  <option value="restaurant">restaurant</option>
                  <option value="cafe">cafe</option>
                  <option value="pharmacy">pharmacy</option>
                  <option value="convenience_store">convenience_store</option>
                  <option value="clothing_store">clothing_store</option>
                  <option value="pet_store">pet_store</option>
                  <option value="hardware">hardware</option>
                  <option value="salon">salon</option>
                  <option value="gas_station">gas_station</option>
                  <option value="dry_cleaning">dry_cleaning</option>
                  <option value="shipping">shipping</option>
                  <option value="other">other</option>
                </select>
                <input className="form-input" placeholder="ZIP Code *" value={merchantZip} onChange={e => setMerchantZip(e.target.value)} />
                {merchantZip !== userZip && merchantZip.length === 5 && (
                  <div style={{fontSize: '0.85rem', color: '#856404', marginBottom: '12px'}}>
                    ℹ️ Outside your area — will be personal only
                  </div>
                )}
                <input className="form-input" placeholder="Address" value={merchantAddress} onChange={e => setMerchantAddress(e.target.value)} />
                <div style={{display: 'flex', gap: '8px', marginTop: '4px'}}>
                  <button className="btn btn-success" onClick={saveMerchant}>Save</button>
                  <button className="btn btn-secondary" onClick={() => setShowMerchantForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {merchants.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🏪</div>
                No merchants yet. Add your first one!
              </div>
            ) : (
              merchants.map((m: any) => (
                <div key={m.id} style={{background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(45,74,45,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div style={{fontWeight: 600, fontSize: '1rem', color: '#1a1a1a', marginBottom: '4px'}}>
                      {m.name}
                      {m.is_personal && (
                        <span style={{background: '#e3f2fd', color: '#1976d2', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '8px'}}>
                          Personal
                        </span>
                      )}
                    </div>
                    <div style={{fontSize: '0.85rem', color: '#666'}}>
                      {m.category} • {m.zip}{m.address && ` • ${m.address}`}
                    </div>
                  </div>
                  <button className="btn btn-danger btn-small" onClick={() => hideMerchant(m.id, m.name)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </>
  );
}
