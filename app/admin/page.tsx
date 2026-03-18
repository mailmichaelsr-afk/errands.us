// app/admin/page.tsx - Complete Admin Dashboard

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Territory = {
  id: number;
  name: string;
  zip_codes: string[];
  owner_id?: number;
  owner_name?: string;
  owner_email?: string;
  status: string;
  price?: number;
  time_slots?: string[];
};

type User = {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  status: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  created_at: string;
};

type Request = {
  id: number;
  title: string;
  status: string;
  customer_name?: string;
  runner_name?: string;
  offered_amount?: number;
  delivery_zip?: string;
  created_at: string;
  assigned_to?: number;
};

type Merchant = {
  id: number;
  name: string;
  category: string;
  address?: string;
  zip?: string;
  status: string;
  submitted_by?: string;
  creator_name?: string;
  creator_email?: string;
};

export default function AdminDashboard() {
  const { user, isAdmin, dbUserId, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<"operations" | "territories" | "people" | "requests" | "merchants" | "applications">("operations");
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedTerritory, setExpandedTerritory] = useState<number | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<{[key: number]: string}>({});
  const [peopleFilter, setPeopleFilter] = useState<"all" | "runners" | "customers" | "owners" | "pending">("all");

  // Chat state
  const [chatUserId, setChatUserId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatName, setChatName] = useState("");

  // Territory form
  const [showTerritoryForm, setShowTerritoryForm] = useState(false);
  const [editingTerritoryId, setEditingTerritoryId] = useState<number | null>(null);
  const [newTerritoryName, setNewTerritoryName] = useState("");
  const [newTerritoryZips, setNewTerritoryZips] = useState("");
  const [newTerritoryPrice, setNewTerritoryPrice] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/login");
  }, [user, isAdmin, loading, router]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [terrRes, usersRes, reqRes, merchRes, appRes] = await Promise.all([
        fetch("/.netlify/functions/territories-get"),
        fetch("/.netlify/functions/users-get"),
        fetch("/.netlify/functions/requests-get"),
        fetch("/.netlify/functions/merchants-get-all"),
        fetch("/.netlify/functions/territory-applications-get"),
      ]);
      if (terrRes.ok) setTerritories(await terrRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
      if (merchRes.ok) setMerchants(await merchRes.json());
      if (appRes.ok) setApplications(await appRes.json());
    } catch (e) {
      console.error("Failed to load admin data:", e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const openChat = async (userId: number, name: string) => {
    setChatUserId(userId);
    setChatName(name);
    setChatInput("");
    const res = await fetch(`/.netlify/functions/direct-messages-get?user_id=${dbUserId}&other_user_id=${userId}`);
    if (res.ok) setChatMessages(await res.json());
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatUserId || !dbUserId) return;
    await fetch('/.netlify/functions/direct-messages-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_user_id: dbUserId, to_user_id: chatUserId, body: chatInput.trim() })
    });
    setChatInput("");
    const res = await fetch(`/.netlify/functions/direct-messages-get?user_id=${dbUserId}&other_user_id=${chatUserId}`);
    if (res.ok) setChatMessages(await res.json());
  };

  const saveTerritory = async () => {
    if (!newTerritoryName.trim() || !newTerritoryZips.trim()) return;
    const zipArray = newTerritoryZips.split(",").map(z => z.trim()).filter(Boolean);
    const endpoint = editingTerritoryId
      ? "/.netlify/functions/territories-update"
      : "/.netlify/functions/territories-create";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingTerritoryId,
        name: newTerritoryName.trim(),
        zip_codes: zipArray,
        price: newTerritoryPrice ? parseFloat(newTerritoryPrice) : null,
        status: editingTerritoryId ? undefined : "active",
        time_slots: ["morning", "afternoon", "evening"],
      }),
    });
    setShowTerritoryForm(false);
    setNewTerritoryName(""); setNewTerritoryZips(""); setNewTerritoryPrice("");
    setEditingTerritoryId(null);
    loadData();
  };

  const deleteTerritory = async (id: number, name: string) => {
    if (!confirm(`Delete territory "${name}"?`)) return;
    await fetch("/.netlify/functions/territories-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const assignTerritory = async (territoryId: number) => {
    const userId = selectedOwner[territoryId];
    if (!userId) return;
    await fetch("/.netlify/functions/territories-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ territory_id: territoryId, user_id: parseInt(userId) }),
    });
    setSelectedOwner({...selectedOwner, [territoryId]: ""});
    loadData();
  };

  const unassignTerritory = async (territoryId: number) => {
    await fetch("/.netlify/functions/territories-unassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ territory_id: territoryId }),
    });
    loadData();
  };

  const updateUserStatus = async (userId: number, status: string) => {
    await fetch("/.netlify/functions/users-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, status }),
    });
    loadData();
  };

  const updateUserRole = async (userId: number, role: string) => {
    await fetch("/.netlify/functions/users-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role }),
    });
    loadData();
  };

  const deleteUser = async (userId: number, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    await fetch("/.netlify/functions/users-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    loadData();
  };

  const deleteRequest = async (id: number) => {
    if (!confirm("Delete this request?")) return;
    await fetch("/.netlify/functions/requests-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const approveMerchant = async (id: number) => {
    await fetch("/.netlify/functions/merchants-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved" }),
    });
    loadData();
  };

  const deleteMerchant = async (id: number, name: string) => {
    if (!confirm(`Delete merchant "${name}"?`)) return;
    await fetch("/.netlify/functions/merchants-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  if (loading || !isAdmin) return null;

  // Computed stats
  const openRequests = requests.filter(r => r.status === 'open');
  const inProgressRequests = requests.filter(r => r.status === 'accepted');
  const uncoveredRequests = openRequests.filter(r => {
    const age = (Date.now() - new Date(r.created_at).getTime()) / 1000 / 60;
    return age > 60; // older than 1 hour
  });
  const pendingMerchants = merchants.filter(m => m.status === 'pending');
  const pendingOwners = users.filter(u => u.role === 'territory_owner' && u.status === 'pending');
  const runners = users.filter(u => u.role === 'runner' || u.role === 'independent_driver');
  const customers = users.filter(u => u.role === 'customer');
  const owners = users.filter(u => u.role === 'territory_owner');
  const activeOwners = owners.filter(u => u.status === 'active');

  const today = new Date();
  today.setHours(0,0,0,0);
  const newSignupsToday = users.filter(u => new Date(u.created_at) >= today).length;
  const newRequestsToday = requests.filter(r => new Date(r.created_at) >= today).length;

  const filteredPeople = users.filter(u => {
    if (peopleFilter === 'all') return true;
    if (peopleFilter === 'runners') return u.role === 'runner' || u.role === 'independent_driver';
    if (peopleFilter === 'customers') return u.role === 'customer';
    if (peopleFilter === 'owners') return u.role === 'territory_owner';
    if (peopleFilter === 'pending') return u.status === 'pending';
    return true;
  });

  const getRunnersInZip = (zips: string[]) => {
    return runners.filter(r => r.zip && zips.includes(r.zip));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 1100px; margin: 0 auto; padding: 28px 20px 80px; }

        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .logo { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .header-right { display: flex; gap: 10px; align-items: center; }
        .back-btn { background: #f5f0e8; border: 1.5px solid #e0d8cc; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; color: #2d4a2d; font-weight: 500; font-family: 'DM Sans', sans-serif; }

        .ops-bar {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px; margin-bottom: 24px;
        }
        .ops-card {
          background: #fff; border-radius: 12px; padding: 16px;
          box-shadow: 0 2px 8px rgba(45,74,45,0.06);
          border-left: 4px solid #e0d8cc;
        }
        .ops-card.alert { border-left-color: #dc3545; }
        .ops-card.good { border-left-color: #7ab87a; }
        .ops-card.info { border-left-color: #2d4a2d; }
        .ops-label { font-size: 0.72rem; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .ops-value { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 700; color: #2d4a2d; }
        .ops-sub { font-size: 0.75rem; color: #aaa; margin-top: 2px; }

        .tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 2px solid #e0d8cc; overflow-x: auto; }
        .tab { padding: 10px 18px; background: none; border: none; font-size: 0.88rem; font-weight: 500; color: #888; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; margin-bottom: -2px; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
        .tab.active { color: #2d4a2d; border-bottom-color: #7ab87a; }

        .section-head { display: flex; justify-content: space-between; align-items: center; margin: 20px 0 14px; }
        .section-title { font-family: 'Fraunces', serif; font-size: 1.1rem; color: #2d4a2d; font-weight: 600; }

        .card { background: #fff; border-radius: 14px; padding: 18px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(45,74,45,0.06); border: 1px solid #f0ebe0; }
        .card.expanded { border-color: #7ab87a; }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; cursor: pointer; }
        .card-title { font-weight: 700; font-size: 0.98rem; color: #1a1a1a; margin-bottom: 4px; }
        .card-meta { font-size: 0.82rem; color: #888; }
        .card-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }

        .expanded-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0ebe0; }
        .expanded-title { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 10px; }

        .person-card { background: #f5f0e8; border-radius: 10px; padding: 12px; margin-bottom: 8px; }
        .person-name { font-weight: 600; font-size: 0.9rem; color: #2d4a2d; margin-bottom: 3px; }
        .person-detail { font-size: 0.8rem; color: #666; margin-bottom: 2px; }

        .btn { padding: 7px 14px; border-radius: 8px; border: none; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .btn-primary { background: #2d4a2d; color: #f5f0e8; }
        .btn-primary:hover { background: #3d6b3d; }
        .btn-success { background: #7ab87a; color: #fff; }
        .btn-success:hover { background: #5fa05f; }
        .btn-danger { background: #dc3545; color: #fff; }
        .btn-danger:hover { background: #c82333; }
        .btn-secondary { background: #f5f0e8; color: #555; border: 1px solid #e0d8cc; }
        .btn-secondary:hover { background: #e8e0d4; }
        .btn-sm { padding: 5px 10px; font-size: 0.78rem; }

        .badge { display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 0.72rem; font-weight: 600; margin-left: 6px; }
        .badge-active { background: #d4f0d4; color: #2d6a2d; }
        .badge-pending { background: #fff0e6; color: #c67700; }
        .badge-suspended { background: #ffe0e0; color: #c00; }
        .badge-open { background: #d4f0d4; color: #2d6a2d; }
        .badge-accepted { background: #fdf3cc; color: #7a5c00; }
        .badge-completed { background: #e8e8e8; color: #555; }
        .badge-approved { background: #d4f0d4; color: #2d6a2d; }
        .badge-alert { background: #ffe0e0; color: #c00; }

        .filter-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .filter-btn { padding: 6px 14px; border-radius: 20px; border: 1.5px solid #e0d8cc; background: #faf8f4; color: #555; font-size: 0.82rem; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .filter-btn.active { background: #2d4a2d; color: #f5f0e8; border-color: #2d4a2d; }

        .input { width: 100%; padding: 10px 12px; margin-bottom: 10px; border: 1.5px solid #e0d8cc; border-radius: 8px; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; background: #faf8f4; outline: none; color: #1a1a1a; }
        .input:focus { border-color: #7ab87a; background: #fff; }
        .form-card { background: #fff; border-radius: 14px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 10px rgba(45,74,45,0.1); border: 1px solid #e0d8cc; }

        .empty { text-align: center; padding: 40px; color: #bbb; font-size: 0.9rem; }
        .alert-banner { background: #ffe0e0; border: 1px solid #ffaaaa; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 0.88rem; color: #c00; display: flex; align-items: center; gap: 8px; }

        .role-select { padding: 4px 8px; border: 1px solid #e0d8cc; border-radius: 6px; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; background: #faf8f4; cursor: pointer; }

        @media (max-width: 600px) {
          .ops-bar { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="page">
        <div className="header">
          <div>
            <div className="logo">errand<span>s</span></div>
            <div style={{color: '#999', fontSize: '0.85rem', marginTop: '2px'}}>Admin Dashboard</div>
          </div>
          <div className="header-right">
            <button className="back-btn" onClick={() => router.push('/')}>← Home</button>
          </div>
        </div>

        {/* Operations Bar */}
        <div className="ops-bar">
          <div className={`ops-card ${openRequests.length > 0 ? 'info' : 'good'}`}>
            <div className="ops-label">Open Requests</div>
            <div className="ops-value">{openRequests.length}</div>
            <div className="ops-sub">awaiting runner</div>
          </div>
          <div className={`ops-card ${inProgressRequests.length > 0 ? 'good' : ''}`}>
            <div className="ops-label">In Progress</div>
            <div className="ops-value">{inProgressRequests.length}</div>
            <div className="ops-sub">being delivered</div>
          </div>
          <div className={`ops-card ${uncoveredRequests.length > 0 ? 'alert' : 'good'}`}>
            <div className="ops-label">Uncovered 1hr+</div>
            <div className="ops-value">{uncoveredRequests.length}</div>
            <div className="ops-sub">need attention</div>
          </div>
          <div className="ops-card good">
            <div className="ops-label">New Signups Today</div>
            <div className="ops-value">{newSignupsToday}</div>
            <div className="ops-sub">{users.length} total users</div>
          </div>
          <div className="ops-card info">
            <div className="ops-label">Requests Today</div>
            <div className="ops-value">{newRequestsToday}</div>
            <div className="ops-sub">{requests.length} total</div>
          </div>
          <div className={`ops-card ${pendingMerchants.length > 0 || pendingOwners.length > 0 ? 'alert' : 'good'}`}>
            <div className="ops-label">Pending Approvals</div>
            <div className="ops-value">{pendingMerchants.length + pendingOwners.length}</div>
            <div className="ops-sub">{pendingOwners.length} owners, {pendingMerchants.length} merchants</div>
          </div>
        </div>

        {/* Alert for uncovered requests */}
        {uncoveredRequests.length > 0 && (
          <div className="alert-banner">
            ⚠️ {uncoveredRequests.length} request{uncoveredRequests.length !== 1 ? 's have' : ' has'} been open for over an hour with no runner assigned.
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'operations' ? 'active' : ''}`} onClick={() => setTab('operations')}>
            🏠 Overview
          </button>
          <button className={`tab ${tab === 'territories' ? 'active' : ''}`} onClick={() => setTab('territories')}>
            📍 Territories ({territories.length})
          </button>
          <button className={`tab ${tab === 'people' ? 'active' : ''}`} onClick={() => setTab('people')}>
            👥 People ({users.length})
            {pendingOwners.length > 0 && <span style={{color: '#dc3545', marginLeft: '4px'}}>●</span>}
          </button>
          <button className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
            📦 Requests ({requests.length})
          </button>
          <button className={`tab ${tab === 'merchants' ? 'active' : ''}`} onClick={() => setTab('merchants')}>
            🏪 Merchants ({merchants.length})
            {pendingMerchants.length > 0 && <span style={{color: '#dc3545', marginLeft: '4px'}}>●</span>}
          </button>
          <button className={`tab ${tab === 'applications' ? 'active' : ''}`} onClick={() => setTab('applications')}>
            📋 Applications ({applications.length})
            {applications.filter(a => a.status === 'pending').length > 0 && <span style={{color: '#dc3545', marginLeft: '4px'}}>●</span>}
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'operations' && (
          <>
            <div className="section-head">
              <div className="section-title">Active Requests</div>
            </div>
            {openRequests.length === 0 && inProgressRequests.length === 0 ? (
              <div className="empty">No active requests right now.</div>
            ) : (
              [...openRequests, ...inProgressRequests].slice(0, 10).map(r => (
                <div key={r.id} className="card">
                  <div className="card-top" onClick={() => router.push(`/request/${r.id}`)}>
                    <div>
                      <div className="card-title">{r.title}</div>
                      <div className="card-meta">
                        {r.customer_name && `👤 ${r.customer_name} • `}
                        {r.offered_amount && `$${r.offered_amount} • `}
                        {r.delivery_zip && `ZIP ${r.delivery_zip} • `}
                        {new Date(r.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </div>
                    </div>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </div>
                </div>
              ))
            )}

            <div className="section-head" style={{marginTop: '28px'}}>
              <div className="section-title">Coverage by Territory</div>
            </div>
            {territories.map(t => {
              const runnersHere = getRunnersInZip(t.zip_codes || []);
              const requestsHere = openRequests.filter(r => r.delivery_zip && t.zip_codes?.includes(r.delivery_zip));
              return (
                <div key={t.id} className="card">
                  <div className="card-title">{t.name}</div>
                  <div className="card-meta">
                    ZIPs: {t.zip_codes?.join(', ')} •
                    {t.owner_name ? ` Owner: ${t.owner_name}` : ' No owner'} •
                    {runnersHere.length} runner{runnersHere.length !== 1 ? 's' : ''} •
                    {requestsHere.length} open request{requestsHere.length !== 1 ? 's' : ''}
                    {requestsHere.length > 0 && runnersHere.length === 0 && (
                      <span className="badge badge-alert" style={{marginLeft: '8px'}}>⚠️ No coverage</span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* TERRITORIES TAB */}
        {tab === 'territories' && (
          <>
            <div className="section-head">
              <div className="section-title">All Territories</div>
              <button className="btn btn-primary" onClick={() => {
                setEditingTerritoryId(null);
                setNewTerritoryName(""); setNewTerritoryZips(""); setNewTerritoryPrice("");
                setShowTerritoryForm(true);
              }}>+ New Territory</button>
            </div>

            {showTerritoryForm && (
              <div className="form-card">
                <div style={{fontWeight: 700, marginBottom: '14px', color: '#2d4a2d'}}>
                  {editingTerritoryId ? 'Edit Territory' : 'Create Territory'}
                </div>
                <input className="input" placeholder="Territory name (e.g. Oconto - 54153)" value={newTerritoryName} onChange={e => setNewTerritoryName(e.target.value)} />
                <input className="input" placeholder="ZIP codes, comma separated (e.g. 54153, 54154)" value={newTerritoryZips} onChange={e => setNewTerritoryZips(e.target.value)} />
                <input className="input" type="number" placeholder="Monthly price (optional)" value={newTerritoryPrice} onChange={e => setNewTerritoryPrice(e.target.value)} />
                <div style={{display: 'flex', gap: '8px'}}>
                  <button className="btn btn-primary" onClick={saveTerritory}>
                    {editingTerritoryId ? 'Save Changes' : 'Create'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowTerritoryForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {loadingData ? <div className="empty">Loading...</div> : territories.length === 0 ? (
              <div className="empty">No territories yet.</div>
            ) : territories.map(t => {
              const isExpanded = expandedTerritory === t.id;
              const runnersHere = getRunnersInZip(t.zip_codes || []);
              const owner = users.find(u => u.id === t.owner_id);

              return (
                <div key={t.id} className={`card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="card-top" onClick={() => setExpandedTerritory(isExpanded ? null : t.id)}>
                    <div style={{flex: 1}}>
                      <div className="card-title">
                        {t.name}
                        <span className={`badge badge-${t.status === 'active' ? 'active' : 'pending'}`}>{t.status}</span>
                      </div>
                      <div className="card-meta">
                        ZIPs: {t.zip_codes?.join(', ')} •
                        {owner ? ` Owner: ${owner.full_name}` : ' No owner assigned'} •
                        {runnersHere.length} runner{runnersHere.length !== 1 ? 's' : ''}
                        {t.price && ` • $${t.price}/mo`}
                      </div>
                    </div>
                    <span style={{color: '#aaa', fontSize: '0.8rem'}}>{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {isExpanded && (
                    <>
                      {/* Owner details */}
                      <div className="expanded-section">
                        <div className="expanded-title">Territory Owner</div>
                        {owner ? (
                          <div className="person-card">
                            <div className="person-name">{owner.full_name}</div>
                            <div className="person-detail">📧 {owner.email}</div>
                            {owner.phone && <div className="person-detail">📞 {owner.phone}</div>}
                            {owner.street && <div className="person-detail">📍 {owner.street}, {owner.city}, {owner.state} {owner.zip}</div>}
                            <div style={{marginTop: '8px', display: 'flex', gap: '8px'}}>
                              <button className="btn btn-danger btn-sm" onClick={() => unassignTerritory(t.id)}>Remove Owner</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{marginBottom: '10px'}}>
                            <div style={{fontSize: '0.85rem', color: '#888', marginBottom: '8px'}}>No owner assigned</div>
                            {activeOwners.length > 0 && (
                              <div style={{display: 'flex', gap: '8px'}}>
                                <select className="input" style={{marginBottom: 0, flex: 1}}
                                  value={selectedOwner[t.id] || ""}
                                  onChange={e => setSelectedOwner({...selectedOwner, [t.id]: e.target.value})}>
                                  <option value="">Select owner...</option>
                                  {activeOwners.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                  ))}
                                </select>
                                <button className="btn btn-success" onClick={() => assignTerritory(t.id)} disabled={!selectedOwner[t.id]}>
                                  Assign
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Runners */}
                      <div className="expanded-section">
                        <div className="expanded-title">Runners in this territory ({runnersHere.length})</div>
                        {runnersHere.length === 0 ? (
                          <div style={{fontSize: '0.85rem', color: '#bbb'}}>No runners with a ZIP code matching this territory</div>
                        ) : runnersHere.map(r => (
                          <div key={r.id} className="person-card">
                            <div className="person-name">{r.full_name}</div>
                            <div className="person-detail">📧 {r.email}</div>
                            {r.phone && <div className="person-detail">📞 {r.phone}</div>}
                            {r.street && <div className="person-detail">📍 {r.street}, {r.city}, {r.state} {r.zip}</div>}
                          </div>
                        ))}
                      </div>

                      {/* Territory actions */}
                      <div className="card-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          setEditingTerritoryId(t.id);
                          setNewTerritoryName(t.name);
                          setNewTerritoryZips(t.zip_codes?.join(', ') || '');
                          setNewTerritoryPrice(t.price?.toString() || '');
                          setShowTerritoryForm(true);
                          setExpandedTerritory(null);
                        }}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteTerritory(t.id, t.name)}>🗑️ Delete</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* PEOPLE TAB */}
        {tab === 'people' && (
          <>
            <div className="section-head">
              <div className="section-title">All Users</div>
              <div style={{fontSize: '0.82rem', color: '#888'}}>
                {runners.length} runners • {customers.length} customers • {owners.length} owners
              </div>
            </div>

            <div className="filter-row">
              {[
                { key: 'all', label: `All (${users.length})` },
                { key: 'runners', label: `Runners (${runners.length})` },
                { key: 'customers', label: `Customers (${customers.length})` },
                { key: 'owners', label: `Owners (${owners.length})` },
                { key: 'pending', label: `Pending (${users.filter(u => u.status === 'pending').length})` },
              ].map(f => (
                <button key={f.key} className={`filter-btn ${peopleFilter === f.key ? 'active' : ''}`}
                  onClick={() => setPeopleFilter(f.key as any)}>
                  {f.label}
                </button>
              ))}
            </div>

            {filteredPeople.length === 0 ? (
              <div className="empty">No users in this category.</div>
            ) : filteredPeople.map(u => (
              <div key={u.id} className="card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px'}}>
                  <div style={{flex: 1}}>
                    <div className="card-title">
                      {u.full_name || '(No name)'}
                      <span className={`badge badge-${u.status}`}>{u.status}</span>
                      <span className="badge" style={{background: '#f0f0f0', color: '#555'}}>{u.role}</span>
                    </div>
                    <div className="card-meta" style={{marginTop: '4px'}}>
                      📧 {u.email}
                      {u.phone && ` • 📞 ${u.phone}`}
                    </div>
                    {u.street && (
                      <div className="card-meta" style={{marginTop: '2px'}}>
                        📍 {u.street}, {u.city}, {u.state} {u.zip}
                      </div>
                    )}
                    <div className="card-meta" style={{marginTop: '2px'}}>
                      Joined {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="card-actions">
                  {u.status === 'pending' && (
                    <button className="btn btn-success btn-sm" onClick={() => updateUserStatus(u.id, 'active')}>✅ Approve</button>
                  )}
                  {u.status === 'active' && (
                    <button className="btn btn-danger btn-sm" onClick={() => updateUserStatus(u.id, 'suspended')}>🚫 Suspend</button>
                  )}
                  {u.status === 'suspended' && (
                    <button className="btn btn-success btn-sm" onClick={() => updateUserStatus(u.id, 'active')}>✅ Reactivate</button>
                  )}
                  <select className="role-select" value={u.role}
                    onChange={e => { if (confirm(`Change ${u.full_name}'s role to ${e.target.value}?`)) updateUserRole(u.id, e.target.value); }}>
                    <option value="customer">customer</option>
                    <option value="runner">runner</option>
                    <option value="territory_owner">territory_owner</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id, u.full_name)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* REQUESTS TAB */}
        {tab === 'requests' && (
          <>
            <div className="section-head">
              <div className="section-title">All Requests</div>
            </div>
            {requests.length === 0 ? (
              <div className="empty">No requests yet.</div>
            ) : requests.slice(0, 50).map(r => (
              <div key={r.id} className="card">
                <div className="card-top" onClick={() => router.push(`/request/${r.id}`)}>
                  <div style={{flex: 1}}>
                    <div className="card-title">{r.title}</div>
                    <div className="card-meta">
                      {r.customer_name && `👤 ${r.customer_name}`}
                      {r.runner_name && ` • 🏃 ${r.runner_name}`}
                      {r.offered_amount && ` • $${r.offered_amount}`}
                      {r.delivery_zip && ` • ZIP ${r.delivery_zip}`}
                      {` • ${new Date(r.created_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
                <div className="card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/request/${r.id}`)}>💬 View</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteRequest(r.id)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* MERCHANTS TAB */}
        {tab === 'merchants' && (
          <>
            {pendingMerchants.length > 0 && (
              <>
                <div className="section-head">
                  <div className="section-title">⏳ Pending Approval ({pendingMerchants.length})</div>
                </div>
                {pendingMerchants.map(m => (
                  <div key={m.id} className="card" style={{borderLeft: '4px solid #ffc107'}}>
                    <div className="card-title">{m.name}</div>
                    <div className="card-meta">
                      {m.category} • {m.address} • {m.zip}
                      {m.creator_name && ` • Added by ${m.creator_name}`}
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-success btn-sm" onClick={() => approveMerchant(m.id)}>✅ Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteMerchant(m.id, m.name)}>🗑️ Reject & Delete</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="section-head">
              <div className="section-title">All Merchants ({merchants.filter(m => m.status !== 'pending').length})</div>
              <button className="btn btn-secondary btn-sm" onClick={() => router.push('/admin/merchants')}>
                Full Merchant Manager →
              </button>
            </div>
            {merchants.filter(m => m.status !== 'pending').map(m => (
              <div key={m.id} className="card">
                <div className="card-title">
                  {m.name}
                  <span className={`badge badge-${m.status}`}>{m.status}</span>
                </div>
                <div className="card-meta">
                  {m.category} • {m.address} • ZIP {m.zip}
                  {m.creator_name && ` • Added by ${m.creator_name}`}
                </div>
                <div className="card-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => deleteMerchant(m.id, m.name)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* APPLICATIONS TAB */}
        {tab === 'applications' && (
          <>
            <div className="section-head">
              <div className="section-title">Territory Applications</div>
            </div>

            {applications.length === 0 ? (
              <div className="empty">No applications yet.</div>
            ) : applications.map(a => {
              const slotCount = a.desired_slots?.length || 0;
              const monthlyRate = slotCount;
              const annualRate = slotCount * 12;
              const formatHour = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`;

              return (
                <div key={a.id} className="card" style={{borderLeft: a.status === 'pending' ? '4px solid #ffc107' : a.status === 'approved' ? '4px solid #7ab87a' : '4px solid #e0d8cc'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
                    <div>
                      <div className="card-title">{a.full_name}</div>
                      <div className="card-meta">📧 {a.email}{a.phone && ` • 📞 ${a.phone}`}</div>
                      {a.street && <div className="card-meta">📍 {a.street}, {a.city}, {a.state} {a.zip}</div>}
                    </div>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </div>

                  <div style={{background: '#f5f0e8', borderRadius: '10px', padding: '12px', marginBottom: '10px'}}>
                    <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '8px'}}>
                      <div>
                        <div style={{fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px'}}>Desired ZIP</div>
                        <div style={{fontWeight: 700, color: '#2d4a2d', fontSize: '1.1rem'}}>{a.desired_zip}</div>
                      </div>
                      <div>
                        <div style={{fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px'}}>Time Slots</div>
                        <div style={{fontWeight: 700, color: '#2d4a2d', fontSize: '1.1rem'}}>{slotCount} hour{slotCount !== 1 ? 's' : ''}</div>
                      </div>
                      <div>
                        <div style={{fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px'}}>Monthly</div>
                        <div style={{fontWeight: 700, color: '#2d4a2d', fontSize: '1.1rem'}}>${monthlyRate}</div>
                      </div>
                      <div>
                        <div style={{fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px'}}>Annual</div>
                        <div style={{fontWeight: 700, color: '#7ab87a', fontSize: '1.1rem'}}>${annualRate}</div>
                      </div>
                    </div>

                    {a.desired_slots?.length > 0 && (
                      <div>
                        <div style={{fontSize: '0.72rem', color: '#999', marginBottom: '6px'}}>Selected hours:</div>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                          {[...a.desired_slots].sort((x: string, y: string) => parseInt(x) - parseInt(y)).map((h: string) => (
                            <span key={h} style={{background: '#2d4a2d', color: '#f5f0e8', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600}}>
                              {formatHour(parseInt(h))}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {a.business_name && <div className="card-meta" style={{marginBottom: '4px'}}>🏢 {a.business_name}</div>}
                  {a.why && (
                    <div style={{background: '#fff', border: '1px solid #e0d8cc', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px', fontSize: '0.85rem', color: '#444', lineHeight: 1.5}}>
                      "{a.why}"
                    </div>
                  )}

                  <div style={{fontSize: '0.78rem', color: '#aaa', marginBottom: '10px'}}>
                    Applied {new Date(a.created_at).toLocaleDateString()}
                  </div>

                  <div className="card-actions">
                    {a.status === 'pending' && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={async () => {
                          await fetch('/.netlify/functions/territory-application-update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: a.id, status: 'approved' })
                          });
                          loadData();
                        }}>✅ Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={async () => {
                          await fetch('/.netlify/functions/territory-application-update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: a.id, status: 'rejected' })
                          });
                          loadData();
                        }}>❌ Reject</button>
                      </>
                    )}
                    {a.status === 'approved' && (
                      <span style={{fontSize: '0.82rem', color: '#7ab87a', fontWeight: 600}}>✅ Approved — assign territory in Territories tab</span>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => openChat(a.user_id, a.full_name)}>
                      💬 Message
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* CHAT MODAL */}
        {chatUserId && (
          <>
            <div onClick={() => setChatUserId(null)} style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 99998,
            }} />
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: '#fff', borderRadius: '20px 20px 0 0',
              zIndex: 99999, maxHeight: '70vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
            }}>
              {/* Header */}
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{fontWeight: 700, color: '#2d4a2d', fontSize: '1rem'}}>
                  💬 {chatName}
                </div>
                <button onClick={() => setChatUserId(null)} style={{
                  background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#999',
                }}>✕</button>
              </div>

              {/* Messages */}
              <div style={{flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {chatMessages.length === 0 ? (
                  <div style={{textAlign: 'center', color: '#bbb', padding: '20px', fontSize: '0.88rem'}}>
                    No messages yet. Start the conversation.
                  </div>
                ) : chatMessages.map(m => {
                  const isMe = m.from_user_id === dbUserId;
                  return (
                    <div key={m.id} style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        background: isMe ? '#2d4a2d' : '#f5f0e8',
                        color: isMe ? '#f5f0e8' : '#1a1a1a',
                        padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        maxWidth: '75%', fontSize: '0.88rem', lineHeight: 1.5,
                      }}>
                        {m.body}
                      </div>
                      <div style={{fontSize: '0.72rem', color: '#aaa', marginTop: '3px'}}>
                        {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div style={{padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px'}}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, padding: '10px 14px', border: '1.5px solid #e0d8cc',
                    borderRadius: '20px', fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.9rem', outline: 'none', background: '#faf8f4', color: '#1a1a1a',
                  }}
                />
                <button onClick={sendChatMessage} style={{
                  background: '#2d4a2d', color: '#f5f0e8', border: 'none',
                  borderRadius: '20px', padding: '10px 18px', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.88rem',
                }}>
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
