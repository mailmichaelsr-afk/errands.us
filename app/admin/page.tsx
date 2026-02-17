// app/admin/page.tsx (with time-based territories)

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
  time_slot_days?: string[];
  time_slot_start?: string;
  time_slot_end?: string;
};

type User = {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  status: string;
  created_at: string;
};

type Merchant = {
  id: number;
  name: string;
  category: string;
  address?: string;
  status: string;
  submitted_by: string;
};

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', 
  fri: 'Fri', sat: 'Sat', sun: 'Sun'
};

const PRESET_SHIFTS = [
  { label: '24/7', days: ['mon','tue','wed','thu','fri','sat','sun'], start: '00:00', end: '23:59' },
  { label: 'Weekdays', days: ['mon','tue','wed','thu','fri'], start: '00:00', end: '23:59' },
  { label: 'Weekends', days: ['sat','sun'], start: '00:00', end: '23:59' },
  { label: 'Morning (6am-2pm)', days: ['mon','tue','wed','thu','fri'], start: '06:00', end: '14:00' },
  { label: 'Evening (2pm-10pm)', days: ['mon','tue','wed','thu','fri'], start: '14:00', end: '22:00' },
  { label: 'Late Night (10pm-6am)', days: ['mon','tue','wed','thu','fri','sat','sun'], start: '22:00', end: '06:00' },
];

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  
  const [tab, setTab] = useState<"territories" | "users" | "merchants">("territories");
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  
  const [showTerritoryForm, setShowTerritoryForm] = useState(false);
  const [newTerritoryName, setNewTerritoryName] = useState("");
  const [newTerritoryZips, setNewTerritoryZips] = useState("");
  const [newTerritoryPrice, setNewTerritoryPrice] = useState("");
  const [newTimeDays, setNewTimeDays] = useState<string[]>(['mon','tue','wed','thu','fri','sat','sun']);
  const [newTimeStart, setNewTimeStart] = useState("00:00");
  const [newTimeEnd, setNewTimeEnd] = useState("23:59");
  
  const [loadingData, setLoadingData] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState<{[key: number]: string}>({});

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/login");
    }
  }, [user, isAdmin, loading]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [terrRes, usersRes, merchRes] = await Promise.all([
        fetch("/.netlify/functions/territories-get"),
        fetch("/.netlify/functions/users-get"),
        fetch("/.netlify/functions/merchants-get-all"),
      ]);
      if (terrRes.ok) setTerritories(await terrRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (merchRes.ok) setMerchants(await merchRes.json());
    } catch (e) {
      console.error("Failed to load admin data:", e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const applyPreset = (preset: typeof PRESET_SHIFTS[0]) => {
    setNewTimeDays(preset.days);
    setNewTimeStart(preset.start);
    setNewTimeEnd(preset.end);
  };

  const toggleDay = (day: string) => {
    if (newTimeDays.includes(day)) {
      setNewTimeDays(newTimeDays.filter(d => d !== day));
    } else {
      setNewTimeDays([...newTimeDays, day]);
    }
  };

  const createTerritory = async () => {
    if (!newTerritoryName.trim() || !newTerritoryZips.trim()) return;
    
    const zipArray = newTerritoryZips.split(",").map(z => z.trim());
    
    await fetch("/.netlify/functions/territories-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTerritoryName.trim(),
        zip_codes: zipArray,
        price: newTerritoryPrice ? parseFloat(newTerritoryPrice) : null,
        status: "available",
        time_slot_days: newTimeDays,
        time_slot_start: newTimeStart + ":00",
        time_slot_end: newTimeEnd + ":00",
      }),
    });
    
    setNewTerritoryName("");
    setNewTerritoryZips("");
    setNewTerritoryPrice("");
    setNewTimeDays(['mon','tue','wed','thu','fri','sat','sun']);
    setNewTimeStart("00:00");
    setNewTimeEnd("23:59");
    setShowTerritoryForm(false);
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

  const approveUser = async (userId: number) => {
    await fetch("/.netlify/functions/users-update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, status: "active" }),
    });
    loadData();
  };

  const suspendUser = async (userId: number) => {
    await fetch("/.netlify/functions/users-update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, status: "suspended" }),
    });
    loadData();
  };

  const approveMerchant = async (merchantId: number) => {
    await fetch("/.netlify/functions/merchants-moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: merchantId, status: "approved" }),
    });
    loadData();
  };

  const rejectMerchant = async (merchantId: number) => {
    await fetch("/.netlify/functions/merchants-moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: merchantId, status: "rejected" }),
    });
    loadData();
  };

  const formatTimeSlot = (t: Territory) => {
    if (!t.time_slot_days || !t.time_slot_start || !t.time_slot_end) return "24/7";
    
    const days = t.time_slot_days.map(d => DAY_LABELS[d]).join(', ');
    const start = t.time_slot_start.slice(0, 5); // "HH:MM"
    const end = t.time_slot_end.slice(0, 5);
    
    if (start === '00:00' && end === '23:59') return days;
    return `${days} ${start}-${end}`;
  };

  if (loading || !isAdmin) return null;

  const pendingOwners = users.filter(u => u.role === "territory_owner" && u.status === "pending");
  const availableTerritories = territories.filter(t => t.status === "available");
  const soldTerritories = territories.filter(t => t.status === "sold");
  const pendingMerchants = merchants.filter(m => m.status === "pending");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 1200px; margin: 0 auto; padding: 32px 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .logo { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .admin-badge { background: #2d4a2d; color: #f5f0e8; padding: 6px 14px; border-radius: 100px; font-size: 0.8rem; font-weight: 500; }
        
        .stats {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px; margin-bottom: 32px;
        }
        .stat-card {
          background: #fff; padding: 20px; border-radius: 14px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .stat-label { font-size: 0.8rem; color: #999; margin-bottom: 6px; }
        .stat-value { font-family: 'Fraunces', serif; font-size: 2rem; color: #2d4a2d; font-weight: 700; }

        .tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid #e0d8cc; }
        .tab {
          padding: 12px 20px; background: none; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          font-weight: 500; color: #666; cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s; margin-bottom: -2px;
        }
        .tab.active { color: #2d4a2d; border-bottom-color: #7ab87a; }
        .tab:hover:not(.active) { color: #2d4a2d; }

        .section-head {
          font-family: 'Fraunces', serif; font-size: 1.2rem;
          color: #2d4a2d; margin: 28px 0 14px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .btn {
          padding: 9px 16px; border-radius: 10px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .btn-primary { background: #2d4a2d; color: #f5f0e8; }
        .btn-primary:hover { background: #3d6b3d; }
        .btn-success { background: #7ab87a; color: #fff; }
        .btn-success:hover { background: #5fa05f; }
        .btn-danger { background: #dc3545; color: #fff; }
        .btn-danger:hover { background: #c82333; }
        .btn-secondary { background: #f5f0e8; color: #555; border: 1.5px solid #e0d8cc; }
        .btn-secondary:hover { background: #e8e0d4; }
        .btn-ghost { background: #faf8f4; color: #666; font-size: 0.8rem; padding: 6px 12px; }
        .btn-ghost:hover { background: #f0f0e8; }

        .card {
          background: #fff; border-radius: 14px; padding: 20px;
          margin-bottom: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .card-title { font-weight: 600; font-size: 1rem; color: #1a1a1a; margin-bottom: 8px; }
        .card-meta { font-size: 0.85rem; color: #999; margin-bottom: 12px; }
        .card-actions { display: flex; gap: 8px; align-items: center; }

        .form-card {
          background: #fff; border-radius: 14px; padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(45,74,45,0.1);
          border: 1px solid rgba(45,74,45,0.07);
        }
        .input {
          display: block; width: 100%; padding: 11px 14px; margin-bottom: 12px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
        }
        .input:focus { border-color: #7ab87a; background: #fff; }
        
        .label { font-size: 0.88rem; font-weight: 500; color: #555; margin: 14px 0 8px; display: block; }
        
        .preset-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 12px; }
        .day-toggle { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
        .day-btn {
          padding: 8px 14px; border-radius: 8px; border: 1.5px solid #e0d8cc;
          background: #faf8f4; cursor: pointer; font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          transition: all 0.2s; color: #666;
        }
        .day-btn.active { background: #2d4a2d; color: #f5f0e8; border-color: #2d4a2d; }
        .day-btn:hover:not(.active) { border-color: #7ab87a; }
        
        .time-row { display: flex; gap: 10px; align-items: center; }
        .time-row .input { margin-bottom: 0; flex: 1; }

        .badge {
          display: inline-block; padding: 3px 10px; border-radius: 100px;
          font-size: 0.75rem; font-weight: 500;
        }
        .badge-available { background: #d4f0d4; color: #2d6a2d; }
        .badge-sold { background: #fdf3cc; color: #7a5c00; }
        .badge-pending { background: #fff0e6; color: #c67700; }
        .badge-active { background: #d4f0d4; color: #2d6a2d; }
        .badge-suspended { background: #ffe0e0; color: #c00; }
        .timeslot-badge { background: #e6f0ff; color: #0056b3; margin-left: 8px; }

        select.input { cursor: pointer; }
        .empty { text-align: center; padding: 40px; color: #bbb; font-size: 0.9rem; }
      `}</style>

      <div className="page">
        <div className="header">
          <div>
            <div className="logo">errand<span>s</span></div>
            <div style={{ color: "#999", fontSize: "0.9rem", marginTop: 4 }}>Admin Dashboard</div>
          </div>
          <div className="admin-badge">👤 {user?.user_metadata?.full_name || user?.email}</div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Total Territories</div>
            <div className="stat-value">{territories.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Available</div>
            <div className="stat-value">{availableTerritories.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sold</div>
            <div className="stat-value">{soldTerritories.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value">{pendingOwners.length + pendingMerchants.length}</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "territories" ? "active" : ""}`} onClick={() => setTab("territories")}>
            Territories
          </button>
          <button className={`tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
            Users {pendingOwners.length > 0 && `(${pendingOwners.length})`}
          </button>
          <button className={`tab ${tab === "merchants" ? "active" : ""}`} onClick={() => setTab("merchants")}>
            Merchants {pendingMerchants.length > 0 && `(${pendingMerchants.length})`}
          </button>
        </div>

        {tab === "territories" && (
          <>
            <div className="section-head">
              <span>Territories</span>
              <button className="btn btn-primary" onClick={() => setShowTerritoryForm(!showTerritoryForm)}>
                + Create Territory
              </button>
            </div>

            {showTerritoryForm && (
              <div className="form-card">
                <input
                  className="input"
                  placeholder="Territory name (e.g. Downtown LA - Evening Shift)"
                  value={newTerritoryName}
                  onChange={e => setNewTerritoryName(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Zip codes (comma-separated: 90210, 90211)"
                  value={newTerritoryZips}
                  onChange={e => setNewTerritoryZips(e.target.value)}
                />
                <input
                  className="input"
                  type="number"
                  placeholder="Price (optional)"
                  value={newTerritoryPrice}
                  onChange={e => setNewTerritoryPrice(e.target.value)}
                />
                
                <div className="label">Time Slot Presets</div>
                <div className="preset-grid">
                  {PRESET_SHIFTS.map(preset => (
                    <button
                      key={preset.label}
                      className="btn btn-ghost"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="label">Days Active</div>
                <div className="day-toggle">
                  {['mon','tue','wed','thu','fri','sat','sun'].map(day => (
                    <button
                      key={day}
                      className={`day-btn ${newTimeDays.includes(day) ? 'active' : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                </div>

                <div className="label">Time Range</div>
                <div className="time-row">
                  <input
                    className="input"
                    type="time"
                    value={newTimeStart}
                    onChange={e => setNewTimeStart(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    className="input"
                    type="time"
                    value={newTimeEnd}
                    onChange={e => setNewTimeEnd(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={createTerritory}>Create</button>
                  <button className="btn btn-secondary" onClick={() => setShowTerritoryForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {loadingData ? (
              <div className="empty">Loading...</div>
            ) : territories.length === 0 ? (
              <div className="empty">No territories yet. Create your first one!</div>
            ) : (
              territories.map(t => (
                <div key={t.id} className="card">
                  <div className="card-title">
                    {t.name} 
                    <span className={`badge badge-${t.status}`}>{t.status}</span>
                    <span className="badge timeslot-badge">⏰ {formatTimeSlot(t)}</span>
                  </div>
                  <div className="card-meta">
                    Zip codes: {t.zip_codes?.join(", ") || "None"}
                    {t.price && ` • $${t.price}`}
                    {t.owner_name && ` • Owner: ${t.owner_name} (${t.owner_email})`}
                  </div>
                  {t.status === "available" && pendingOwners.length > 0 && (
                    <div className="card-actions">
                      <select 
                        className="input" 
                        style={{ width: "auto", marginBottom: 0 }}
                        value={selectedOwner[t.id] || ""}
                        onChange={e => setSelectedOwner({...selectedOwner, [t.id]: e.target.value})}
                      >
                        <option value="">Assign to...</option>
                        {pendingOwners.map(u => (
                          <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                        ))}
                      </select>
                      <button 
                        className="btn btn-success"
                        onClick={() => assignTerritory(t.id)}
                        disabled={!selectedOwner[t.id]}
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {tab === "users" && (
          <>
            {pendingOwners.length > 0 && (
              <>
                <div className="section-head">Pending Territory Owner Applications</div>
                {pendingOwners.map(u => (
                  <div key={u.id} className="card">
                    <div className="card-title">{u.full_name}</div>
                    <div className="card-meta">
                      {u.email} • {u.phone} • Applied {new Date(u.created_at).toLocaleDateString()}
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-success" onClick={() => approveUser(u.id)}>Approve</button>
                      <button className="btn btn-danger" onClick={() => suspendUser(u.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="section-head">All Users</div>
            {users.map(u => (
              <div key={u.id} className="card">
                <div className="card-title">
                  {u.full_name} <span className={`badge badge-${u.status}`}>{u.status}</span>
                </div>
                <div className="card-meta">
                  {u.role} • {u.email} • Joined {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "merchants" && (
          <>
            {pendingMerchants.length > 0 && (
              <>
                <div className="section-head">Pending Merchant Submissions</div>
                {pendingMerchants.map(m => (
                  <div key={m.id} className="card">
                    <div className="card-title">{m.name}</div>
                    <div className="card-meta">
                      {m.category} • {m.address} • Submitted by {m.submitted_by}
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-success" onClick={() => approveMerchant(m.id)}>Approve</button>
                      <button className="btn btn-danger" onClick={() => rejectMerchant(m.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="section-head">All Merchants</div>
            {merchants.filter(m => m.status !== "pending").map(m => (
              <div key={m.id} className="card">
                <div className="card-title">
                  {m.name} <span className={`badge badge-${m.status}`}>{m.status}</span>
                </div>
                <div className="card-meta">
                  {m.category} • {m.address}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
