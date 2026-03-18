// app/runner/page.tsx - Complete runner dashboard

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";


type Request = {
  id: number;
  title: string;
  status: string;
  customer_id: number;
  assigned_to?: number;
  customer_name?: string;
  customer_email?: string;
  offered_amount?: number;
  payment_method?: string;
  pickup_flexibility?: string;
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
  merchant_phone?: string;
  merchant_hours?: string;
  created_at: string;
  completed_at?: string;
  request_type?: string;
  // legacy fields
  pickup?: string;
  dropoff?: string;
};

function formatAddress(street?: string, city?: string, state?: string, zip?: string, fallback?: string) {
  if (street) return `${street}, ${city || ''} ${state || ''} ${zip || ''}`.trim();
  return fallback || 'Address not provided';
}

function thisMonthEarnings(jobs: Request[]) {
  const now = new Date();
  return jobs.filter(j => {
    const d = new Date(j.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, j) => sum + (j.offered_amount || 0), 0);
}

export default function RunnerDashboard() {
  const { user, dbUserId, loading } = useAuth();
  const router = useRouter();

  const [openRequests, setOpenRequests] = useState<Request[]>([]);
  const [myJobs, setMyJobs] = useState<Request[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Request[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [tab, setTab] = useState<"available" | "myjobs" | "history" | "merchants" | "guide">("available");
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Merchant form state
  const [userZip, setUserZip] = useState("");
  const [canAddMerchants, setCanAddMerchants] = useState(true);
  const [showMerchantForm, setShowMerchantForm] = useState(false);
  const [merchantName, setMerchantName] = useState("");
  const [merchantCategory, setMerchantCategory] = useState("grocery");
  const [merchantAddress, setMerchantAddress] = useState("");
  const [merchantZip, setMerchantZip] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoadingData(true);

    try {
      const userRes = await fetch(`/.netlify/functions/users-get?id=${dbUserId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserZip(userData.zip || "");
        setCanAddMerchants(userData.can_add_merchants !== false);
        setIsOnline(userData.runner_status === 'online');

        const activeZip = userData.service_zip || userData.zip || "";
        if (activeZip) {
          const merchRes = await fetch(
            `/.netlify/functions/merchants-get-for-user?user_id=${dbUserId}&zip=${activeZip}`
          );
          if (merchRes.ok) setMerchants(await merchRes.json());
        }
      }

      const res = await fetch("/.netlify/functions/requests-get");
      if (res.ok) {
        const all = await res.json();

        setOpenRequests(all.filter((r: Request) =>
          r.status === 'open' && (!r.assigned_to || r.assigned_to === dbUserId)
        ));
        setMyJobs(all.filter((r: Request) =>
          r.assigned_to === dbUserId && r.status === 'accepted'
        ));
        setCompletedJobs(all.filter((r: Request) =>
          r.assigned_to === dbUserId && r.status === 'completed'
        ));
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }

    setLoadingData(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (dbUserId) {
      loadData();
      const interval = setInterval(() => {
        if (tab !== 'guide' && tab !== 'merchants') loadData();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [dbUserId, tab]);

  const acceptRequest = async (requestId: number) => {
    try {
      const res = await fetch("/.netlify/functions/requests-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, runner_id: dbUserId }),
      });
      if (res.ok) {
        setTab("myjobs");
        loadData();
        alert("✅ Job accepted!");
      } else {
        alert("❌ Already accepted by someone else");
      }
    } catch (e) {
      alert("Failed to accept");
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
          address: merchantAddress, zip: merchantZip, user_zip: userZip,
        }),
      });
      if (!res.ok) { const e = await res.json(); alert(`Failed: ${e.error}`); return; }
      setShowMerchantForm(false);
      setMerchantName(""); setMerchantCategory("grocery"); setMerchantAddress(""); setMerchantZip(userZip);
      loadData();
      alert(merchantZip !== userZip ? `✅ Added to your personal list` : `✅ Added! Everyone in ZIP ${merchantZip} can see it.`);
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const hideMerchant = async (merchantId: number, name: string) => {
    if (!confirm(`Remove "${name}"? (Won't delete for others)`)) return;
    await fetch("/.netlify/functions/merchants-hide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: dbUserId, merchant_id: merchantId }),
    });
    loadData();
  };

  const toggleOnlineStatus = async () => {
    if (!dbUserId || togglingStatus) return;
    setTogglingStatus(true);
    const newStatus = isOnline ? 'offline' : 'online';
    const res = await fetch('/.netlify/functions/runner-status-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: dbUserId, status: newStatus })
    });
    if (res.ok) setIsOnline(!isOnline);
    setTogglingStatus(false);
  };

  if (loading || loadingData) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', color: '#888' }}>Loading...</div>;
  }

  if (!user) return null;

  const totalEarned = completedJobs.reduce((s, j) => s + (j.offered_amount || 0), 0);
  const monthEarned = thisMonthEarnings(completedJobs);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 800px; margin: 0 auto; padding: 24px 16px 80px; }

        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .logo { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .subtitle { color: #888; font-size: 0.9rem; margin-top: 2px; }
        .header-right { display: flex; align-items: center; gap: 10px; }
        .back-btn { background: #f5f0e8; border: 1.5px solid #e0d8cc; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; color: #2d4a2d; font-weight: 500; }
        .refresh-btn { background: #fff; border: 1.5px solid #e0d8cc; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; color: #2d4a2d; }

        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
        .stat-card { background: #fff; padding: 14px; border-radius: 12px; box-shadow: 0 2px 8px rgba(45,74,45,0.06); }
        .stat-label { font-size: 0.7rem; color: #999; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-family: 'Fraunces', serif; font-size: 1.4rem; color: #2d4a2d; font-weight: 700; }
        .stat-sub { font-size: 0.72rem; color: #aaa; margin-top: 2px; }

        .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid #e0d8cc; overflow-x: auto; }
        .tab { padding: 10px 16px; background: none; border: none; font-size: 0.88rem; font-weight: 500; color: #888; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; margin-bottom: -2px; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
        .tab.active { color: #2d4a2d; border-bottom-color: #7ab87a; }

        .job-card { background: #fff; border-radius: 14px; padding: 18px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(45,74,45,0.06); border: 1px solid #f0ebe0; }
        .job-card.mine { border-left: 4px solid #7ab87a; }
        .job-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px; }
        .job-title { font-weight: 700; font-size: 1rem; color: #1a1a1a; flex: 1; }
        .job-amount { font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 700; color: #2d4a2d; white-space: nowrap; }

        .address-block { background: #f5f0e8; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
        .address-row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 0.88rem; }
        .address-row:last-child { margin-bottom: 0; }
        .address-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
        .address-text { color: #333; line-height: 1.4; }
        .address-label { font-size: 0.72rem; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .instructions { background: #fff9e6; border: 1px solid #ffe9a0; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; font-size: 0.85rem; color: #7a5c00; }

        .job-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .meta-tag { background: #f5f0e8; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; color: #666; }
        .meta-tag.payment { background: #e8f5e9; color: #2d6a2d; }

        .job-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn { padding: 9px 16px; border-radius: 10px; border: none; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .btn-primary { background: #2d4a2d; color: #f5f0e8; }
        .btn-primary:hover { background: #3d6b3d; }
        .btn-success { background: #7ab87a; color: #fff; }
        .btn-success:hover { background: #5fa05f; }
        .btn-secondary { background: #f5f0e8; color: #555; border: 1px solid #e0d8cc; }
        .btn-secondary:hover { background: #e8e0d4; }
        .btn-danger { background: #dc3545; color: #fff; }
        .btn-sm { padding: 6px 12px; font-size: 0.8rem; }

        .customer-contact { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #f0f7f0; border-radius: 10px; margin-bottom: 10px; }
        .customer-name { font-weight: 600; font-size: 0.9rem; color: #2d4a2d; flex: 1; }

        .badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; }
        .badge-open { background: #d4f0d4; color: #2d6a2d; }
        .badge-accepted { background: #fdf3cc; color: #7a5c00; }
        .badge-completed { background: #e8e8e8; color: #555; }

        .empty { text-align: center; padding: 60px 20px; color: #bbb; }
        .empty-icon { font-size: 3rem; margin-bottom: 12px; }

        .history-stats { background: #f0f7f0; border-radius: 14px; padding: 20px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px; }
        .hist-stat { text-align: center; }
        .hist-label { font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .hist-value { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 700; color: #2d4a2d; }
        .hist-sub { font-size: 0.75rem; color: #7ab87a; margin-top: 2px; }

        .form-input { width: 100%; padding: 10px 12px; margin-bottom: 10px; border: 1.5px solid #e0d8cc; border-radius: 8px; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; background: #faf8f4; outline: none; }
        .form-input:focus { border-color: #7ab87a; }

        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .section-title { font-size: 1rem; font-weight: 700; color: #2d4a2d; }

        @media (max-width: 500px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="page">
        <div className="header">
          <div>
            <div className="logo">errand<span>s</span></div>
            <div className="subtitle">Runner Dashboard</div>
          </div>
          <div className="header-right">
            <button
              onClick={toggleOnlineStatus}
              disabled={togglingStatus}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: 'none',
                background: isOnline ? '#7ab87a' : '#e0d8cc',
                color: isOnline ? '#fff' : '#666',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              <span style={{width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#fff' : '#999', display: 'inline-block'}} />
              {togglingStatus ? '...' : isOnline ? 'Online' : 'Go Online'}
            </button>
            <button className="refresh-btn" onClick={() => loadData(true)} disabled={refreshing}>
              {refreshing ? '⟳' : '↻'} Refresh
            </button>
            {dbUserId && <NotificationBell userId={dbUserId} role="runner" />}
            <button className="back-btn" onClick={() => router.push('/')}>← Home</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Available</div>
            <div className="stat-value">{openRequests.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Jobs</div>
            <div className="stat-value">{myJobs.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">This Month</div>
            <div className="stat-value">${monthEarned.toFixed(0)}</div>
            <div className="stat-sub">{completedJobs.filter(j => {
              const d = new Date(j.created_at); const n = new Date();
              return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
            }).length} jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">All Time</div>
            <div className="stat-value">${totalEarned.toFixed(0)}</div>
            <div className="stat-sub">{completedJobs.length} jobs</div>
          </div>
        </div>

        {/* Tabs */}
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
          <button className={`tab ${tab === "guide" ? "active" : ""}`} onClick={() => setTab("guide")}>
            📖 Guide
          </button>
        </div>

        {/* Available Jobs */}
        {tab === "available" && (
          <>
            {openRequests.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📦</div>
                No available jobs right now. Check back soon!
              </div>
            ) : openRequests.map(r => (
              <div key={r.id} className="job-card">
                <div className="job-top">
                  <div className="job-title">{r.title}</div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px'}}>
                    {r.request_type === 'task' && (
                      <span style={{fontSize:'0.72rem', background:'#e8f5e9', color:'#2d6a2d', padding:'2px 8px', borderRadius:'100px', fontWeight:600, whiteSpace:'nowrap'}}>🔧 Odd Job</span>
                    )}
                    {r.offered_amount ? (
                      <div className="job-amount">${r.offered_amount}</div>
                    ) : null}
                  </div>
                </div>

                <div className="address-block">
                  <div className="address-row">
                    <div className="address-icon">📍</div>
                    <div>
                      <div className="address-label">Pickup{r.merchant_name ? ` — ${r.merchant_name}` : ''}</div>
                      <div className="address-text">{formatAddress(r.pickup_street, r.pickup_city, r.pickup_state, r.pickup_zip, r.merchant_address || r.pickup)}</div>
                      {r.merchant_hours && <div style={{fontSize:'0.78rem',color:'#888',marginTop:'2px'}}>🕐 {r.merchant_hours}</div>}
                    </div>
                  </div>
                  <div className="address-row">
                    <div className="address-icon">🏠</div>
                    <div>
                      <div className="address-label">Deliver to</div>
                      <div className="address-text">{formatAddress(r.delivery_street, r.delivery_city, r.delivery_state, r.delivery_zip, r.dropoff)}</div>
                    </div>
                  </div>
                </div>

                {r.delivery_instructions && (
                  <div className="instructions">
                    📝 <strong>Delivery instructions:</strong> {r.delivery_instructions}
                  </div>
                )}

                <div className="job-meta">
                  {r.payment_method && <span className="meta-tag payment">💳 {r.payment_method}</span>}
                  {r.pickup_flexibility && <span className="meta-tag">⏱ {r.pickup_flexibility}</span>}
                  <span className="meta-tag">📅 {new Date(r.created_at).toLocaleDateString()}</span>
                  {r.delivery_zip && <span className="meta-tag">📮 {r.delivery_zip}</span>}
                </div>

                <div className="job-actions">
                  <button className="btn btn-primary" onClick={() => acceptRequest(r.id)}>
                    ✅ Accept Job
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/request/${r.id}`)}>
                    💬 View & Chat
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* My Active Jobs */}
        {tab === "myjobs" && (
          <>
            {myJobs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                No active jobs. Accept one from Available Jobs!
              </div>
            ) : myJobs.map(r => (
              <div key={r.id} className="job-card mine">
                <div className="job-top">
                  <div className="job-title">{r.title}</div>
                  {r.offered_amount ? <div className="job-amount">${r.offered_amount}</div> : null}
                </div>

                {r.customer_name && (
                  <div className="customer-contact">
                    <span>👤</span>
                    <span className="customer-name">{r.customer_name}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/request/${r.id}`)}>
                      💬 Chat
                    </button>
                  </div>
                )}

                <div className="address-block">
                  <div className="address-row">
                    <div className="address-icon">📍</div>
                    <div>
                      <div className="address-label">Pickup{r.merchant_name ? ` — ${r.merchant_name}` : ''}</div>
                      <div className="address-text">{formatAddress(r.pickup_street, r.pickup_city, r.pickup_state, r.pickup_zip, r.merchant_address || r.pickup)}</div>
                      {r.merchant_hours && <div style={{fontSize:'0.78rem',color:'#888',marginTop:'2px'}}>🕐 {r.merchant_hours}</div>}
                    </div>
                  </div>
                  <div className="address-row">
                    <div className="address-icon">🏠</div>
                    <div>
                      <div className="address-label">Deliver to</div>
                      <div className="address-text">{formatAddress(r.delivery_street, r.delivery_city, r.delivery_state, r.delivery_zip, r.dropoff)}</div>
                    </div>
                  </div>
                </div>

                {r.delivery_instructions && (
                  <div className="instructions">
                    📝 <strong>Delivery instructions:</strong> {r.delivery_instructions}
                  </div>
                )}

                <div className="job-meta">
                  {r.payment_method && <span className="meta-tag payment">💳 {r.payment_method}</span>}
                  {r.pickup_flexibility && <span className="meta-tag">⏱ {r.pickup_flexibility}</span>}
                </div>

                <div className="job-actions">
                  <button className="btn btn-success" onClick={() => completeRequest(r.id)}>
                    ✅ Mark Complete
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/request/${r.id}`)}>
                    💬 Chat
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* History */}
        {tab === "history" && (
          <>
            {completedJobs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📖</div>
                No completed deliveries yet
              </div>
            ) : (
              <>
                <div className="history-stats">
                  <div className="hist-stat">
                    <div className="hist-label">Total Deliveries</div>
                    <div className="hist-value">{completedJobs.length}</div>
                  </div>
                  <div className="hist-stat">
                    <div className="hist-label">All Time Earned</div>
                    <div className="hist-value">${totalEarned.toFixed(2)}</div>
                  </div>
                  <div className="hist-stat">
                    <div className="hist-label">This Month</div>
                    <div className="hist-value">${monthEarned.toFixed(2)}</div>
                    <div className="hist-sub">↑ Keep it up!</div>
                  </div>
                  <div className="hist-stat">
                    <div className="hist-label">Avg Per Job</div>
                    <div className="hist-value">${completedJobs.length ? (totalEarned / completedJobs.length).toFixed(2) : '0.00'}</div>
                  </div>
                </div>

                {completedJobs.map(r => (
                  <div key={r.id} className="job-card" onClick={() => router.push(`/request/${r.id}`)}>
                    <div className="job-top">
                      <div className="job-title">{r.title}</div>
                      <div className="job-amount" style={{color: '#7ab87a'}}>+${r.offered_amount?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div style={{fontSize: '0.85rem', color: '#888', marginBottom: '8px'}}>
                      📍 {formatAddress(r.pickup_street, r.pickup_city, r.pickup_state, r.pickup_zip, r.pickup)}
                      {' → '}
                      🏠 {formatAddress(r.delivery_street, r.delivery_city, r.delivery_state, r.delivery_zip, r.dropoff)}
                    </div>
                    <div className="job-meta">
                      {r.customer_name && <span className="meta-tag">👤 {r.customer_name}</span>}
                      <span className="meta-tag">📅 {new Date(r.created_at).toLocaleDateString()}</span>
                      {r.payment_method && <span className="meta-tag payment">💳 {r.payment_method}</span>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* Merchants */}
        {tab === "merchants" && (
          <>
            <div className="section-header">
              <div className="section-title">My Merchant List</div>
              {canAddMerchants && (
                <button className="btn btn-primary btn-sm" onClick={() => {
                  setMerchantName(""); setMerchantCategory("grocery");
                  setMerchantAddress(""); setMerchantZip(userZip);
                  setShowMerchantForm(true);
                }}>
                  + Add Merchant
                </button>
              )}
            </div>

            {!userZip && (
              <div style={{background: '#fff3cd', border: '1px solid #ffc107', color: '#856404', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem'}}>
                ⚠️ Add your ZIP code in <button style={{background: 'none', border: 'none', color: '#856404', textDecoration: 'underline', cursor: 'pointer'}} onClick={() => router.push('/profile')}>Profile Settings</button> to see merchants in your area.
              </div>
            )}

            {!canAddMerchants && (
              <div style={{background: '#ffe0e0', border: '1px solid #ffaaaa', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem'}}>
                ⚠️ You cannot add merchants. Contact support if this is an error.
              </div>
            )}

            {showMerchantForm && (
              <div style={{background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 10px rgba(45,74,45,0.1)'}}>
                <div style={{fontWeight: 700, marginBottom: '14px', color: '#2d4a2d'}}>Add Merchant</div>
                <input className="form-input" placeholder="Business Name *" value={merchantName} onChange={e => setMerchantName(e.target.value)} />
                <select className="form-input" value={merchantCategory} onChange={e => setMerchantCategory(e.target.value)}>
                  {['restaurant','cafe','grocery','pharmacy','convenience_store','clothing_store','pet_store','hardware','salon','gas_station','dry_cleaning','shipping','other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input className="form-input" placeholder="ZIP Code *" value={merchantZip} onChange={e => setMerchantZip(e.target.value)} />
                {merchantZip && merchantZip !== userZip && merchantZip.length === 5 && (
                  <div style={{fontSize: '0.82rem', color: '#856404', marginBottom: '10px'}}>ℹ️ Outside your area — personal only</div>
                )}
                <input className="form-input" placeholder="Address (optional)" value={merchantAddress} onChange={e => setMerchantAddress(e.target.value)} />
                <div style={{display: 'flex', gap: '8px'}}>
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
            ) : merchants.map((m: any) => (
              <div key={m.id} style={{background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 2px 6px rgba(45,74,45,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <div style={{fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '3px'}}>
                    {m.name}
                    {m.is_personal && <span style={{background: '#e3f2fd', color: '#1976d2', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', marginLeft: '8px'}}>Personal</span>}
                  </div>
                  <div style={{fontSize: '0.82rem', color: '#888'}}>{m.category} • {m.zip}{m.address && ` • ${m.address}`}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => hideMerchant(m.id, m.name)}>Remove</button>
              </div>
            ))}
          </>
        )}

        {/* GUIDE TAB */}
        {tab === "guide" && (
          <>
            <div style={{background: '#2d4a2d', borderRadius: '14px', padding: '24px', marginBottom: '20px', color: '#f5f0e8'}}>
              <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px'}}>
                Welcome to Errands.us! 🏃
              </div>
              <div style={{fontSize: '0.9rem', opacity: 0.85, lineHeight: 1.6}}>
                You're a runner. That means people in your area post errands and you get paid to handle them. Here's everything you need to know.
              </div>
            </div>

            {/* How it works */}
            <div style={{background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(45,74,45,0.06)'}}>
              <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2d4a2d', marginBottom: '16px'}}>
                📋 How It Works
              </div>
              {[
                { step: '1', title: 'Customer posts a request', desc: 'They describe what they need, where to pick it up, where to deliver it, and how much they\'ll pay.' },
                { step: '2', title: 'You see it in Available Jobs', desc: 'Open requests show up on your Available tab. You can see the pickup location, delivery address, and the offer before you commit.' },
                { step: '3', title: 'Accept the job', desc: 'Hit Accept and it\'s yours. The customer gets notified. Nobody else can take it.' },
                { step: '4', title: 'Complete the errand', desc: 'Pick up the item, deliver it, then hit Mark Complete. The customer pays you directly — cash, Venmo, Zelle, whatever they chose.' },
                { step: '5', title: 'Repeat', desc: 'The more you do, the more you earn. There\'s no limit.' },
              ].map(item => (
                <div key={item.step} style={{display: 'flex', gap: '14px', marginBottom: '16px'}}>
                  <div style={{background: '#2d4a2d', color: '#f5f0e8', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0}}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{fontWeight: 600, color: '#1a1a1a', marginBottom: '3px'}}>{item.title}</div>
                    <div style={{fontSize: '0.85rem', color: '#666', lineHeight: 1.5}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Setting up your area */}
            <div style={{background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(45,74,45,0.06)'}}>
              <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2d4a2d', marginBottom: '12px'}}>
                📍 Setting Up Your Service Area
              </div>
              <div style={{fontSize: '0.88rem', color: '#555', lineHeight: 1.7}}>
                <p style={{marginBottom: '10px'}}>Your service area is based on your ZIP code in your profile. Jobs posted for your ZIP will show up in your Available Jobs tab.</p>
                <p style={{marginBottom: '10px'}}><strong>To set or update your ZIP:</strong> tap the ← Home button, open the Menu, go to Profile & Settings, and enter your ZIP code.</p>
                <p><strong>Want to work a different area?</strong> You can add merchants in any ZIP code — those will be personal to you only. Customers in that area can still post requests and you'll see them as long as you check the app.</p>
              </div>
            </div>

            {/* Setting up merchants */}
            <div style={{background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(45,74,45,0.06)'}}>
              <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2d4a2d', marginBottom: '12px'}}>
                🏪 Setting Up Merchants
              </div>
              <div style={{fontSize: '0.88rem', color: '#555', lineHeight: 1.7}}>
                <p style={{marginBottom: '10px'}}>Merchants are the stores and businesses you can pick up from. When a customer posts a request, they choose from the merchants in their area. The more merchants you add, the more useful the app is for everyone.</p>
                <p style={{marginBottom: '10px'}}><strong>To add a merchant:</strong> go to the Merchants tab, hit + Add Merchant, and fill in the name, category, ZIP, and address.</p>
                <p style={{marginBottom: '10px'}}><strong>Merchants in your ZIP</strong> are shared with everyone in that area — no duplicate work.</p>
                <p><strong>Merchants outside your ZIP</strong> are personal — only you can see them. Great for expanding your service area.</p>
              </div>
            </div>

            {/* Payments */}
            <div style={{background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(45,74,45,0.06)'}}>
              <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2d4a2d', marginBottom: '12px'}}>
                💰 Getting Paid
              </div>
              <div style={{fontSize: '0.88rem', color: '#555', lineHeight: 1.7}}>
                <p style={{marginBottom: '10px'}}>Payments are handled directly between you and the customer. Errands.us doesn't take a cut.</p>
                <p style={{marginBottom: '10px'}}>When you accept a job, you'll see what the customer is offering and how they want to pay — cash, Venmo, Zelle, PayPal, CashApp, or Apple Pay.</p>
                <p>If the offer seems too low for the job, you don't have to take it. Leave it open and wait — customers can raise their offer if nobody accepts.</p>
              </div>
            </div>

            {/* Promote yourself */}
            <div style={{background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(45,74,45,0.06)'}}>
              <div style={{fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2d4a2d', marginBottom: '12px'}}>
                📣 Promote Yourself
              </div>
              <div style={{fontSize: '0.88rem', color: '#555', marginBottom: '14px', lineHeight: 1.7}}>
                The more people know you're a runner, the more jobs you get. Share this on Facebook, Nextdoor, or text it to people you know.
              </div>

              {[
                {
                  label: 'Facebook / Nextdoor Post',
                  text: `🏃 I just joined Errands.us as a runner in the Oconto area!\n\nNeed someone to pick up groceries, grab your prescription, run to the post office, or handle any other errand? I can help!\n\nPost your request at errands.us, set your price, and I'll take care of it. Cash, Venmo, Zelle — whatever works for you. No app fees, no middleman.\n\n👉 errands.us`,
                },
                {
                  label: 'Short Text / SMS',
                  text: `Hey! I'm now a runner on Errands.us — I can pick up groceries, prescriptions, post office runs, and more. You post the errand, set the price, I handle it. Check it out: errands.us`,
                },
              ].map(post => (
                <div key={post.label} style={{marginBottom: '14px'}}>
                  <div style={{fontSize: '0.78rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px'}}>
                    {post.label}
                  </div>
                  <div style={{background: '#f5f0e8', borderRadius: '10px', padding: '14px', fontSize: '0.85rem', color: '#333', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '8px'}}>
                    {post.text}
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{fontSize: '0.8rem', padding: '7px 14px'}}
                    onClick={() => {
                      navigator.clipboard.writeText(post.text);
                      alert('Copied to clipboard!');
                    }}
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
