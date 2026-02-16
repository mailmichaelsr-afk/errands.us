// app/page.tsx

"use client";
import { useEffect, useState } from "react";

const CATEGORIES = [
  { key: "grocery",    label: "Grocery",         emoji: "🛒" },
  { key: "pharmacy",   label: "Pharmacy",         emoji: "💊" },
  { key: "restaurant", label: "Restaurant",       emoji: "🍜" },
  { key: "shipping",   label: "Shipping",         emoji: "📦" },
  { key: "petcare",    label: "Pet Care",         emoji: "🐾" },
  { key: "hardware",   label: "Hardware",         emoji: "🔧" },
  { key: "bakery",     label: "Bakery & Coffee",  emoji: "☕" },
  { key: "liquor",     label: "Liquor",           emoji: "🍷" },
  { key: "services",   label: "Services",         emoji: "🤝" },
];

type Req = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
};

type Merchant = {
  id: number;
  name: string;
  category: string;
  address?: string;
};

export default function Home() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [title, setTitle] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [validationMsg, setValidationMsg] = useState("");
  const [postError, setPostError] = useState("");

  // Merchant picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerCategory, setPickerCategory] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  const load = async () => {
    // Load requests and merchants independently so one failure can't block the other
    try {
      const reqRes = await fetch("/.netlify/functions/requests-get");
      if (reqRes.ok) setRequests(await reqRes.json());
    } catch (e) { console.error("Failed to load requests:", e); }
    try {
      const merRes = await fetch("/.netlify/functions/merchants-get");
      if (merRes.ok) setMerchants(await merRes.json());
    } catch (e) { console.error("Failed to load merchants:", e); }
  };

  useEffect(() => { load(); }, []);

  const selectMerchant = (m: Merchant) => {
    setSelectedMerchant(m);
    setPickup(m.address || m.name);
    setShowPicker(false);
    setPickerSearch("");
    setPickerCategory(null);
    setValidationMsg("");
  };

  const clearMerchant = () => {
    setSelectedMerchant(null);
    setPickup("");
  };

  const create = async () => {
    // Show a clear message instead of silently failing
    if (!title.trim()) { setValidationMsg("Please describe what you need."); return; }
    if (!pickup.trim()) { setValidationMsg("Please add a pickup location."); return; }
    if (!dropoff.trim()) { setValidationMsg("Please add a dropoff location."); return; }

    setValidationMsg("");
    setPostError("");
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/requests-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), pickup: pickup.trim(), dropoff: dropoff.trim() }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      setTitle(""); setPickup(""); setDropoff("");
      setSelectedMerchant(null);
      setPosted(true);
      setTimeout(() => setPosted(false), 2500);
      load();
    } catch (e: any) {
      setPostError(e.message || "Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(m => {
    const matchCat = !pickerCategory || m.category === pickerCategory;
    const matchSearch = !pickerSearch ||
      m.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      (m.address || "").toLowerCase().includes(pickerSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const statusColor: Record<string, string> = {
    open: "#d4f0d4", accepted: "#fdf3cc", completed: "#e8e8e8",
  };
  const statusLabel: Record<string, string> = {
    open: "🟢 Open", accepted: "🟡 In Progress", completed: "✅ Done",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f5f0e8;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(134,193,134,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,200,120,0.12) 0%, transparent 50%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        .page { max-width: 680px; margin: 0 auto; padding: 28px 16px 80px; }

        .header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 28px; gap: 12px; flex-wrap: wrap;
        }
        .logo {
          font-family: 'Fraunces', serif; font-size: 1.9rem;
          font-weight: 700; color: #2d4a2d; letter-spacing: -0.5px;
        }
        .logo span { color: #7ab87a; }
        .nav-links { display: flex; gap: 8px; }
        .nav-link {
          display: flex; align-items: center; gap: 5px;
          background: #2d4a2d; color: #f5f0e8; text-decoration: none;
          padding: 8px 14px; border-radius: 100px;
          font-size: 0.83rem; font-weight: 500;
          transition: background 0.2s, transform 0.1s;
        }
        .nav-link:hover { background: #3d6b3d; transform: translateY(-1px); }
        .nav-link.secondary {
          background: #fff; color: #2d4a2d;
          border: 1.5px solid #e0d8cc;
        }
        .nav-link.secondary:hover { background: #f0f7f0; border-color: #7ab87a; }

        /* Post card */
        .card {
          background: #fff; border-radius: 20px; padding: 24px;
          box-shadow: 0 4px 24px rgba(45,74,45,0.08);
          border: 1px solid rgba(45,74,45,0.06); margin-bottom: 32px;
        }
        .card-title {
          font-family: 'Fraunces', serif; font-size: 1.2rem;
          color: #2d4a2d; margin-bottom: 18px;
        }
        .input {
          display: block; width: 100%; padding: 12px 14px; margin-bottom: 10px;
          border: 1.5px solid #e0d8cc; border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input:focus {
          border-color: #7ab87a; box-shadow: 0 0 0 3px rgba(122,184,122,0.15);
          background: #fff;
        }
        .input::placeholder { color: #bbb; }

        /* Pickup row */
        .pickup-row { margin-bottom: 10px; }
        .pickup-selected {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-radius: 12px;
          background: #f0f7f0; border: 1.5px solid #7ab87a;
          gap: 8px;
        }
        .pickup-selected-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .pickup-selected-icon {
          width: 32px; height: 32px; background: #d4f0d4;
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; font-size: 1rem; flex-shrink: 0;
        }
        .pickup-selected-name {
          font-weight: 500; font-size: 0.9rem; color: #2d4a2d;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pickup-selected-addr {
          font-size: 0.78rem; color: #7ab87a; margin-top: 1px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pickup-clear {
          background: none; border: none; color: #aaa; font-size: 1.1rem;
          cursor: pointer; flex-shrink: 0; line-height: 1;
          padding: 2px 4px; transition: color 0.15s;
        }
        .pickup-clear:hover { color: #c00; }

        .pickup-or { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
        .or-line { flex: 1; height: 1px; background: #e8e2d8; }
        .or-text { font-size: 0.75rem; color: #bbb; }

        .pick-merchant-btn {
          width: 100%; padding: 10px 14px;
          background: #faf8f4; color: #555;
          border: 1.5px dashed #c8d8c8; border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 6px;
          transition: border-color 0.2s, background 0.2s, color 0.2s;
        }
        .pick-merchant-btn:hover { border-color: #7ab87a; background: #f0f7f0; color: #2d4a2d; }

        /* Merchant picker dropdown */
        .picker {
          background: #fff; border-radius: 16px; margin-top: 8px;
          box-shadow: 0 8px 32px rgba(45,74,45,0.12);
          border: 1px solid rgba(45,74,45,0.08);
          overflow: hidden; margin-bottom: 10px;
        }
        .picker-search {
          display: block; width: 100%; padding: 13px 16px;
          border: none; border-bottom: 1px solid #f0ece4;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #fff; outline: none; color: #1a1a1a;
        }
        .picker-search::placeholder { color: #bbb; }
        .picker-cats {
          display: flex; gap: 6px; overflow-x: auto; padding: 10px 12px;
          border-bottom: 1px solid #f0ece4; scrollbar-width: none;
        }
        .picker-cats::-webkit-scrollbar { display: none; }
        .pcat-btn {
          padding: 5px 11px; border-radius: 100px; flex-shrink: 0;
          border: 1.5px solid transparent;
          font-family: 'DM Sans', sans-serif; font-size: 0.78rem;
          font-weight: 500; cursor: pointer; transition: all 0.12s;
        }
        .pcat-btn.active { background: #2d4a2d; color: #f5f0e8; }
        .pcat-btn.inactive { background: #f5f0e8; color: #666; border-color: #e8e2d8; }
        .pcat-btn.inactive:hover { border-color: #7ab87a; color: #2d4a2d; }

        .picker-list { max-height: 220px; overflow-y: auto; }
        .picker-item {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; cursor: pointer;
          transition: background 0.12s; border-bottom: 1px solid #f9f6f1;
        }
        .picker-item:last-child { border-bottom: none; }
        .picker-item:hover { background: #f5f0e8; }
        .picker-item-icon {
          width: 34px; height: 34px; border-radius: 8px; background: #f0f7f0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; flex-shrink: 0;
        }
        .picker-item-name { font-size: 0.9rem; font-weight: 500; color: #1a1a1a; }
        .picker-item-addr { font-size: 0.78rem; color: #aaa; margin-top: 1px; }
        .picker-empty {
          padding: 24px; text-align: center; color: #bbb; font-size: 0.88rem;
        }
        .picker-footer {
          padding: 10px 16px; border-top: 1px solid #f0ece4;
          background: #faf8f4;
        }
        .picker-footer a {
          font-size: 0.82rem; color: #7ab87a; text-decoration: none; font-weight: 500;
        }
        .picker-footer a:hover { text-decoration: underline; }

        .post-btn {
          margin-top: 14px; width: 100%; padding: 13px;
          background: #2d4a2d; color: #f5f0e8; border: none;
          border-radius: 12px; font-family: 'DM Sans', sans-serif;
          font-size: 1rem; font-weight: 500; cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .post-btn:hover:not(:disabled) { background: #3d6b3d; transform: translateY(-1px); }
        .post-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .post-btn.success { background: #7ab87a; }

        /* Requests list */
        .section-head {
          font-family: 'Fraunces', serif; font-size: 1.3rem;
          color: #2d4a2d; margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .count-badge {
          background: #7ab87a; color: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 0.73rem;
          font-weight: 500; padding: 2px 8px; border-radius: 100px;
        }
        .request-card {
          background: #fff; border-radius: 16px; padding: 16px 18px;
          margin-bottom: 10px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
          display: flex; justify-content: space-between;
          align-items: center; gap: 12px; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .request-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(45,74,45,0.1); }
        .req-title { font-weight: 500; font-size: 0.97rem; color: #1a1a1a; margin-bottom: 4px; }
        .req-route { font-size: 0.82rem; color: #999; display: flex; align-items: center; gap: 4px; }
        .req-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .status-pill {
          font-size: 0.73rem; font-weight: 500;
          padding: 4px 10px; border-radius: 100px; white-space: nowrap;
        }
        .open-btn {
          background: #f5f0e8; border: none; color: #2d4a2d;
          font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
          font-weight: 500; padding: 7px 12px; border-radius: 8px;
          cursor: pointer; transition: background 0.15s; white-space: nowrap;
        }
        .open-btn:hover { background: #e8e0d4; }
        .empty {
          text-align: center; padding: 48px 20px;
          color: #aaa; font-size: 0.93rem;
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
      `}</style>

      <div className="page">
        <header className="header">
          <div className="logo">errand<span>s</span></div>
          <div className="nav-links">
            <a href="/directory" className="nav-link secondary">📍 Directory</a>
            <a href="/runner" className="nav-link">🏃 Runner</a>
          </div>
        </header>

        <div className="card">
          <div className="card-title">Need a hand? 🤝</div>

          <input
            className="input"
            placeholder="What do you need? (e.g. pick up prescriptions)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          {/* Pickup — merchant picker or manual */}
          <div className="pickup-row">
            {selectedMerchant ? (
              <div className="pickup-selected">
                <div className="pickup-selected-left">
                  <div className="pickup-selected-icon">
                    {CATEGORIES.find(c => c.key === selectedMerchant.category)?.emoji || "🏪"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="pickup-selected-name">{selectedMerchant.name}</div>
                    {selectedMerchant.address && (
                      <div className="pickup-selected-addr">{selectedMerchant.address}</div>
                    )}
                  </div>
                </div>
                <button className="pickup-clear" onClick={clearMerchant}>✕</button>
              </div>
            ) : (
              <>
                <input
                  className="input"
                  style={{ marginBottom: 6 }}
                  placeholder="📍 Pickup location (type or pick below)"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                />
                <div className="pickup-or">
                  <div className="or-line" />
                  <span className="or-text">or</span>
                  <div className="or-line" />
                </div>
                <button
                  className="pick-merchant-btn"
                  onClick={() => setShowPicker(!showPicker)}
                >
                  🏪 Pick from local directory
                </button>
              </>
            )}

            {/* Picker dropdown */}
            {showPicker && !selectedMerchant && (
              <div className="picker">
                <input
                  className="picker-search"
                  placeholder="Search stores & services…"
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  autoFocus
                />
                <div className="picker-cats">
                  <button
                    className={`pcat-btn ${pickerCategory === null ? "active" : "inactive"}`}
                    onClick={() => setPickerCategory(null)}
                  >All</button>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.key}
                      className={`pcat-btn ${pickerCategory === c.key ? "active" : "inactive"}`}
                      onClick={() => setPickerCategory(pickerCategory === c.key ? null : c.key)}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
                <div className="picker-list">
                  {filteredMerchants.length === 0 ? (
                    <div className="picker-empty">No results — try a different search</div>
                  ) : (
                    filteredMerchants.map(m => (
                      <div key={m.id} className="picker-item" onClick={() => selectMerchant(m)}>
                        <div className="picker-item-icon">
                          {CATEGORIES.find(c => c.key === m.category)?.emoji || "🏪"}
                        </div>
                        <div>
                          <div className="picker-item-name">{m.name}</div>
                          {m.address && <div className="picker-item-addr">{m.address}</div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="picker-footer">
                  Don't see your place? <a href="/directory">Add it to the directory →</a>
                </div>
              </div>
            )}
          </div>

          <input
            className="input"
            placeholder="🏠 Dropoff location"
            value={dropoff}
            onChange={e => setDropoff(e.target.value)}
          />

          {validationMsg && (
            <div style={{color:"#c44",fontSize:"0.85rem",marginTop:8,padding:"8px 12px",background:"#fff0f0",borderRadius:8}}>
              ⚠️ {validationMsg}
            </div>
          )}
          {postError && (
            <div style={{color:"#c44",fontSize:"0.85rem",marginTop:8,padding:"8px 12px",background:"#fff0f0",borderRadius:8}}>
              ❌ {postError}
            </div>
          )}
          <button
            className={`post-btn${posted ? " success" : ""}`}
            onClick={create}
            disabled={loading}
          >
            {posted ? "✓ Posted!" : loading ? "Posting…" : "Post Request"}
          </button>
        </div>

        <div className="section-head">
          Open Requests
          {requests.filter(r => r.status !== "completed").length > 0 && (
            <span className="count-badge">
              {requests.filter(r => r.status !== "completed").length}
            </span>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🌿</div>
            No requests yet — be the first!
          </div>
        ) : (
          requests.map(r => (
            <div
              key={r.id}
              className="request-card"
              onClick={() => location.href = `/request/${r.id}`}
            >
              <div style={{ minWidth: 0 }}>
                <div className="req-title">{r.title}</div>
                <div className="req-route">
                  <span>{r.pickup}</span><span>→</span><span>{r.dropoff}</span>
                </div>
              </div>
              <div className="req-right">
                <span className="status-pill" style={{ background: statusColor[r.status] || "#eee" }}>
                  {statusLabel[r.status] || r.status}
                </span>
                <button
                  className="open-btn"
                  onClick={e => { e.stopPropagation(); location.href = `/request/${r.id}`; }}
                >
                  View →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
