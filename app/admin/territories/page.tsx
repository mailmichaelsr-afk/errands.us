// app/admin/territories/page.tsx - Territory management

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Territory = {
  id: number;
  name: string;
  zip_codes: string[];
  status: string;
  owner_id?: number;
  owner_name?: string;
  owner_email?: string;
  price?: number;
  time_slot_days: string[];
  time_slot_start: string;
  time_slot_end: string;
};

type User = {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  status: string;
};

const DAY_LABELS: Record<string, string> = {
  mon: 'M', tue: 'T', wed: 'W', thu: 'Th', fri: 'F', sat: 'Sa', sun: 'Su'
};

const PRESET_SHIFTS = [
  { label: '24/7', days: ['mon','tue','wed','thu','fri','sat','sun'], start: '00:00', end: '23:59' },
  { label: 'Weekdays 9-5', days: ['mon','tue','wed','thu','fri'], start: '09:00', end: '17:00' },
  { label: 'Evenings', days: ['mon','tue','wed','thu','fri'], start: '17:00', end: '22:00' },
  { label: 'Weekends', days: ['sat','sun'], start: '08:00', end: '20:00' },
];

export default function AdminTerritories() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [name, setName] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [timeDays, setTimeDays] = useState<string[]>(['mon','tue','wed','thu','fri','sat','sun']);
  const [timeStart, setTimeStart] = useState("00:00");
  const [timeEnd, setTimeEnd] = useState("23:59");
  
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/admin");
    }
  }, [loading, isAdmin, router]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [terrRes, usersRes] = await Promise.all([
        fetch("/.netlify/functions/territories-get"),
        fetch("/.netlify/functions/users-get-all")
      ]);
      
      if (terrRes.ok) setTerritories(await terrRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (e) {
      console.error("Failed to load:", e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const addZip = () => {
    const zip = zipInput.trim();
    if (zip && /^\d{5}$/.test(zip) && !zipCodes.includes(zip)) {
      setZipCodes([...zipCodes, zip]);
      setZipInput("");
    }
  };

  const removeZip = (zip: string) => {
    setZipCodes(zipCodes.filter(z => z !== zip));
  };

  const toggleDay = (day: string) => {
    setTimeDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const applyPreset = (preset: typeof PRESET_SHIFTS[0]) => {
    setTimeDays(preset.days);
    setTimeStart(preset.start);
    setTimeEnd(preset.end);
  };

  const openAdd = () => {
    setName("");
    setZipCodes([]);
    setZipInput("");
    setPrice("");
    setTimeDays(['mon','tue','wed','thu','fri','sat','sun']);
    setTimeStart("00:00");
    setTimeEnd("23:59");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (t: Territory) => {
    setName(t.name);
    setZipCodes(t.zip_codes);
    setPrice(t.price ? t.price.toString() : "");
    setTimeDays(t.time_slot_days);
    setTimeStart(t.time_slot_start.slice(0, 5));
    setTimeEnd(t.time_slot_end.slice(0, 5));
    setEditingId(t.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!name.trim() || zipCodes.length === 0) {
      alert("Territory name and at least one ZIP code required");
      return;
    }
    
    const endpoint = editingId 
      ? "/.netlify/functions/territories-update"
      : "/.netlify/functions/territories-create";
    
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        name: name.trim(),
        zip_codes: zipCodes,
        price: price ? parseFloat(price) : null,
        status: editingId ? undefined : "available",
        time_slot_days: timeDays,
        time_slot_start: timeStart + ":00",
        time_slot_end: timeEnd + ":00",
      }),
    });
    
    setShowForm(false);
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

  const assignOwner = async (territoryId: number, ownerId: number) => {
    await fetch("/.netlify/functions/territories-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        territory_id: territoryId,
        owner_id: ownerId,
      }),
    });
    
    loadData();
  };

  const unassignOwner = async (territoryId: number) => {
    if (!confirm("Remove owner from this territory?")) return;
    
    await fetch("/.netlify/functions/territories-unassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ territory_id: territoryId }),
    });
    
    loadData();
  };

  if (loading || loadingData) {
    return <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>;
  }

  if (!isAdmin) return null;

  const activeOwners = users.filter(u => u.role === 'territory_owner' && u.status === 'active');
  const available = territories.filter(t => t.status === 'available');
  const sold = territories.filter(t => t.status === 'sold');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 1000px; margin: 0 auto; padding: 32px 20px; }
        
        .header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 32px;
        }
        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #2d4a2d; text-decoration: none; font-size: 0.88rem;
          font-weight: 500; opacity: 0.65; transition: opacity 0.15s;
        }
        .back:hover { opacity: 1; }
        .title { font-family: 'Fraunces', serif; font-size: 1.8rem; color: #2d4a2d; font-weight: 700; }
        
        .section-head {
          font-family: 'Fraunces', serif; font-size: 1.2rem;
          color: #2d4a2d; margin: 28px 0 14px; font-weight: 600;
        }
        
        .btn {
          padding: 9px 16px; border-radius: 10px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .btn-primary { background: #2d4a2d; color: #f5f0e8; }
        .btn-primary:hover { background: #3d6b3d; }
        .btn-secondary { background: #f5f0e8; color: #555; border: 1.5px solid #e0d8cc; }
        .btn-secondary:hover { background: #e8e0d4; }
        .btn-danger { background: #dc3545; color: #fff; }
        .btn-danger:hover { background: #c82333; }
        .btn-small { padding: 6px 10px; font-size: 0.8rem; }
        .btn-ghost {
          background: none; border: 1.5px solid #e0d8cc; color: #555;
          padding: 8px 12px; border-radius: 8px; font-size: 0.8rem;
        }
        .btn-ghost:hover { background: #f5f0e8; }

        .form-card {
          background: #fff; border-radius: 14px; padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(45,74,45,0.1);
          border: 1px solid rgba(45,74,45,0.07);
        }
        .input, .select {
          display: block; width: 100%; padding: 11px 14px; margin-bottom: 12px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
        }
        .input:focus, .select:focus { border-color: #7ab87a; background: #fff; }
        .label { font-size: 0.88rem; font-weight: 500; color: #555; margin: 14px 0 8px; display: block; }

        .zip-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
          padding: 12px; background: #faf8f4;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          min-height: 60px; margin-bottom: 12px;
        }
        .zip-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: #2d4a2d; color: #f5f0e8;
          padding: 6px 10px; border-radius: 100px;
          font-size: 0.85rem; font-weight: 500;
        }
        .zip-chip button {
          background: none; border: none; color: #f5f0e8;
          font-size: 1.2rem; cursor: pointer; padding: 0;
          margin: 0; line-height: 1;
        }
        .zip-chip button:hover { color: #ff6b6b; }

        .preset-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 8px; margin-bottom: 12px;
        }

        .day-toggle {
          display: flex; gap: 6px; margin-bottom: 12px;
        }
        .day-btn {
          flex: 1; padding: 8px; background: #fff;
          border: 1.5px solid #e0d8cc; border-radius: 8px;
          font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
        }
        .day-btn.active {
          background: #2d4a2d; color: #f5f0e8;
          border-color: #2d4a2d;
        }

        .time-row {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .time-row span { color: #888; font-size: 0.9rem; }

        .card {
          background: #fff; border-radius: 14px; padding: 20px;
          margin-bottom: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .card-title { font-weight: 600; font-size: 1rem; color: #1a1a1a; margin-bottom: 8px; }
        .card-meta { font-size: 0.85rem; color: #999; margin-bottom: 12px; }
        .card-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 12px; }

        .badge {
          display: inline-block; padding: 3px 10px; border-radius: 100px;
          font-size: 0.75rem; font-weight: 500;
          background: #d4f0d4; color: #2d6a2d;
        }
        .badge-available { background: #e6f0ff; color: #0056b3; }
        .badge-sold { background: #ffe0e0; color: #c00; }

        .owner-assign {
          display: flex; gap: 8px; align-items: center;
          margin-top: 8px; padding-top: 8px;
          border-top: 1px solid #f5f0e8;
        }

        .empty { text-align: center; padding: 40px; color: #bbb; font-size: 0.9rem; }
      `}</style>

      <div className="page">
        <a href="/admin" className="back">← Back to Admin</a>

        <div className="header">
          <div className="title">Manage Territories</div>
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Territory
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, color: '#2d4a2d' }}>
              {editingId ? "Edit Territory" : "Add Territory"}
            </div>
            
            <div className="label">Territory Name</div>
            <input className="input" placeholder="e.g. Oconto - All Day"
              value={name} onChange={e => setName(e.target.value)} />
            
            <div className="label">ZIP Codes</div>
            <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
              <input className="input" placeholder="54153" maxLength={5}
                style={{marginBottom: 0, flex: 1}}
                value={zipInput}
                onChange={e => setZipInput(e.target.value.replace(/\D/g, '').slice(0,5))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addZip())} />
              <button type="button" className="btn btn-secondary" 
                style={{width: 'auto', padding: '0 20px'}}
                onClick={addZip}>Add ZIP</button>
            </div>
            
            <div className="zip-chips">
              {zipCodes.map(zip => (
                <div key={zip} className="zip-chip">
                  {zip}
                  <button type="button" onClick={() => removeZip(zip)}>×</button>
                </div>
              ))}
              {zipCodes.length === 0 && (
                <div style={{color: '#999', fontSize: '0.85rem', padding: '8px'}}>
                  No ZIP codes added yet
                </div>
              )}
            </div>

            <div className="label">Price (optional)</div>
            <input className="input" type="number" placeholder="299.00"
              value={price} onChange={e => setPrice(e.target.value)} />
            
            <div className="label">Time Slot Presets</div>
            <div className="preset-grid">
              {PRESET_SHIFTS.map(preset => (
                <button key={preset.label} className="btn-ghost"
                  onClick={() => applyPreset(preset)}>
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="label">Days Active</div>
            <div className="day-toggle">
              {['mon','tue','wed','thu','fri','sat','sun'].map(day => (
                <button key={day}
                  className={`day-btn ${timeDays.includes(day) ? 'active' : ''}`}
                  onClick={() => toggleDay(day)}>
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>

            <div className="label">Time Range</div>
            <div className="time-row">
              <input className="input" type="time" value={timeStart}
                onChange={e => setTimeStart(e.target.value)} />
              <span>to</span>
              <input className="input" type="time" value={timeEnd}
                onChange={e => setTimeEnd(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={save}>
                {editingId ? "Save Changes" : "Create Territory"}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="section-head">Available Territories ({available.length})</div>
        {available.length === 0 ? (
          <div className="empty">No available territories</div>
        ) : (
          available.map(t => (
            <div key={t.id} className="card">
              <div className="card-title">
                {t.name}
                <span className="badge badge-available">Available</span>
              </div>
              <div className="card-meta">
                ZIP: {t.zip_codes.join(', ')}
                {t.price && ` • $${t.price}`}
                <br />
                {t.time_slot_days.map(d => DAY_LABELS[d]).join('')} {t.time_slot_start.slice(0,5)}-{t.time_slot_end.slice(0,5)}
              </div>
              {activeOwners.length > 0 && (
                <div className="owner-assign">
                  <select className="select" style={{flex: 1, marginBottom: 0}}
                    onChange={e => e.target.value && assignOwner(t.id, parseInt(e.target.value))}>
                    <option value="">Assign to...</option>
                    {activeOwners.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="card-actions">
                <button className="btn btn-secondary btn-small" onClick={() => openEdit(t)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-small" onClick={() => deleteTerritory(t.id, t.name)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        <div className="section-head">Sold Territories ({sold.length})</div>
        {sold.length === 0 ? (
          <div className="empty">No sold territories</div>
        ) : (
          sold.map(t => (
            <div key={t.id} className="card">
              <div className="card-title">
                {t.name}
                <span className="badge badge-sold">Sold</span>
              </div>
              <div className="card-meta">
                Owner: {t.owner_name || t.owner_email}
                <br />
                ZIP: {t.zip_codes.join(', ')}
                {t.price && ` • $${t.price}`}
                <br />
                {t.time_slot_days.map(d => DAY_LABELS[d]).join('')} {t.time_slot_start.slice(0,5)}-{t.time_slot_end.slice(0,5)}
              </div>
              <div className="card-actions">
                <button className="btn btn-secondary btn-small" onClick={() => openEdit(t)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-small" onClick={() => unassignOwner(t.id)}>
                  Remove Owner
                </button>
                <button className="btn btn-danger btn-small" onClick={() => deleteTerritory(t.id, t.name)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
