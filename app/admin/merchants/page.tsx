// app/admin/merchants/page.tsx

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Merchant = {
  id: number;
  name: string;
  category: string;
  address?: string;
  zip?: string;
  phone?: string;
  hours?: string;
  website?: string;
  status: string;
  submitted_by: string;
  created_by?: number;
  created_by_name?: string;
  created_by_email?: string;
  is_personal?: boolean;
};

const CATEGORIES = [
  'restaurant',
  'cafe',
  'grocery',
  'pharmacy',
  'convenience_store',
  'clothing_store',
  'pet_store',
  'hardware',
  'salon',
  'gas_station',
  'dry_cleaning',
  'shipping',
  'other'
];

export default function MerchantsManager() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<number | null>(null);
  const [selectedTerritoryZip, setSelectedTerritoryZip] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState("grocery");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("");
  const [website, setWebsite] = useState("");
  
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/admin");
    }
  }, [user, isAdmin, loading, router]);

  const loadMerchants = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/.netlify/functions/merchants-get-all");
      if (res.ok) setMerchants(await res.json());
    } catch (e) {
      console.error("Failed to load merchants:", e);
    }
    setLoadingData(false);
  };

  const loadTerritories = async () => {
    try {
      const res = await fetch("/.netlify/functions/territories-get");
      if (res.ok) {
        const data = await res.json();
        setTerritories(data);
        // Auto-select first territory
        if (data.length > 0 && !selectedTerritoryId) {
          const firstTerritory = data[0];
          setSelectedTerritoryId(firstTerritory.id);
          // Get first ZIP from zip_codes array
          const firstZip = firstTerritory.zip_codes?.[0] || "";
          setSelectedTerritoryZip(firstZip);
        }
      }
    } catch (e) {
      console.error("Failed to load territories:", e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadMerchants();
      loadTerritories();
    }
  }, [isAdmin]);

  const openAdd = () => {
    setName("");
    setCategory("grocery");
    setAddress("");
    setZip(selectedTerritoryZip); // Auto-fill from selected territory
    setPhone("");
    setHours("");
    setWebsite("");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (m: Merchant) => {
    setName(m.name);
    setCategory(m.category);
    setAddress(m.address || "");
    setZip(m.zip || "");
    setPhone(m.phone || "");
    setHours(m.hours || "");
    setWebsite(m.website || "");
    setEditingId(m.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!name || !category) {
      alert("Name and category are required");
      return;
    }
    
    const endpoint = editingId 
      ? "/.netlify/functions/merchants-update"
      : "/.netlify/functions/merchants-create-admin";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name,
          category,
          address,
          phone,
          hours,
          website,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to save merchant: ${error.error || 'Unknown error'}`);
        return;
      }
      
      setShowForm(false);
      loadMerchants();
      alert(`✅ Merchant ${editingId ? 'updated' : 'created'} successfully`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const deleteMerchant = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    
    await fetch("/.netlify/functions/merchants-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    
    loadMerchants();
  };

  const approve = async (id: number) => {
    await fetch("/.netlify/functions/merchants-moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved" }),
    });
    loadMerchants();
  };

  const reject = async (id: number) => {
    await fetch("/.netlify/functions/merchants-moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "rejected" }),
    });
    loadMerchants();
  };

  // Show loading state
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

  // Redirect if not admin
  if (!isAdmin) return null;

  const pending = merchants.filter(m => m.status === "pending");
  const approved = merchants.filter(m => m.status === "approved");

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
        .btn-small { padding: 6px 10px; font-size: 0.8rem; }

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

        .card {
          background: #fff; border-radius: 14px; padding: 20px;
          margin-bottom: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .card-title { font-weight: 600; font-size: 1rem; color: #1a1a1a; margin-bottom: 8px; }
        .card-meta { font-size: 0.85rem; color: #999; margin-bottom: 12px; }
        .card-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

        .badge {
          display: inline-block; padding: 3px 10px; border-radius: 100px;
          font-size: 0.75rem; font-weight: 500;
          background: #d4f0d4; color: #2d6a2d;
        }
        .badge-pending { background: #fff0e6; color: #c67700; }

        .empty { text-align: center; padding: 40px; color: #bbb; font-size: 0.9rem; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      `}</style>

      <div className="page">
        <a href="/admin" className="back">← Back to Admin</a>

        <div className="header">
          <div className="title">Manage Merchants</div>
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Merchant
          </button>
        </div>

        <div style={{
          background: '#fff', 
          padding: '16px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          border: '2px solid #7ab87a'
        }}>
          <div style={{fontWeight: 600, marginBottom: 8, color: '#2d4a2d'}}>
            Working in Territory:
          </div>
          <select 
            className="select"
            value={selectedTerritoryId || ''}
            onChange={(e) => {
              const terrId = parseInt(e.target.value);
              setSelectedTerritoryId(terrId);
              const territory = territories.find(t => t.id === terrId);
              const firstZip = territory?.zip_codes?.[0] || "";
              setSelectedTerritoryZip(firstZip);
            }}
            style={{marginBottom: 0}}
          >
            <option value="">Select territory...</option>
            {territories.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} - {t.zip_codes?.join(', ')}
              </option>
            ))}
          </select>
          {selectedTerritoryZip && (
            <div style={{marginTop: 8, fontSize: '0.85rem', color: '#666'}}>
              New merchants will be added with ZIP: <strong>{selectedTerritoryZip}</strong>
            </div>
          )}
        </div>

        {showForm && (
          <div className="form-card">
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, color: '#2d4a2d' }}>
              {editingId ? "Edit Merchant" : "Add Merchant"}
            </div>
            
            <div className="label">Business Name *</div>
            <input
              className="input"
              placeholder="e.g. Whole Foods Market"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            
            <div className="label">Category *</div>
            <select 
              className="select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <div className="label">Address</div>
            <input
              className="input"
              placeholder="123 Main St"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
            
            <div className="label">ZIP Code * (from territory: {selectedTerritoryZip || 'not selected'})</div>
            <input
              className="input"
              placeholder="ZIP Code"
              value={zip}
              onChange={e => setZip(e.target.value)}
              style={{background: '#f0f7f0'}}
            />
            
            <div className="grid-2">
              <div>
                <div className="label">Phone</div>
                <input
                  className="input"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div>
                <div className="label">Hours</div>
                <input
                  className="input"
                  placeholder="Mon-Sun 9am-9pm"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                />
              </div>
            </div>
            
            <div className="label">Website</div>
            <input
              className="input"
              placeholder="https://example.com"
              value={website}
              onChange={e => setWebsite(e.target.value)}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={save}>
                {editingId ? "Save Changes" : "Add Merchant"}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <>
            <div className="section-head">Pending Approvals</div>
            {pending.map(m => (
              <div key={m.id} className="card">
                <div className="card-title">
                  {m.name} <span className="badge badge-pending">Pending</span>
                </div>
                <div className="card-meta">
                  {m.category} • {m.address} • Submitted by {m.submitted_by}
                </div>
                <div className="card-actions">
                  <button className="btn btn-success btn-small" onClick={() => approve(m.id)}>
                    Approve
                  </button>
                  <button className="btn btn-danger btn-small" onClick={() => reject(m.id)}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        <div className="section-head">
          <span>All Merchants ({approved.length})</span>
        </div>

        {loadingData ? (
          <div className="empty">Loading...</div>
        ) : approved.length === 0 ? (
          <div className="empty">No merchants yet. Add your first one!</div>
        ) : (
          approved.map(m => (
            <div key={m.id} className="card">
              <div className="card-title">
                {m.name} <span className="badge">Approved</span>
                {m.is_personal && <span className="badge" style={{background: '#e3f2fd'}}>Personal</span>}
              </div>
              <div className="card-meta">
                {m.category}
                {m.address && ` • ${m.address}`}
                {m.zip && ` • ZIP ${m.zip}`}
                {m.phone && ` • ${m.phone}`}
              </div>
              {m.created_by_name && (
                <div style={{fontSize: '0.8rem', color: '#999', marginTop: '6px'}}>
                  Added by: {m.created_by_name} ({m.created_by_email})
                </div>
              )}
              <div className="card-actions">
                <button className="btn btn-secondary btn-small" onClick={() => openEdit(m)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-small" onClick={() => deleteMerchant(m.id, m.name)}>
                  Delete
                </button>
                {m.created_by && (
                  <button 
                    className="btn btn-small"
                    style={{background: '#ff9800', color: '#fff'}}
                    onClick={async () => {
                      if (confirm(`Revoke merchant-adding privileges from ${m.created_by_name}?`)) {
                        await fetch("/.netlify/functions/users-revoke-merchant-access", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ user_id: m.created_by, can_add: false }),
                        });
                        alert(`✅ ${m.created_by_name} can no longer add merchants`);
                      }
                    }}
                  >
                    Revoke Access
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
