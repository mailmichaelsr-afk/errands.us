// app/directory/page.tsx

"use client";
import { useEffect, useState } from "react";

const CATEGORIES = [
  { key: "grocery",   label: "Grocery",    emoji: "🛒" },
  { key: "pharmacy",  label: "Pharmacy",   emoji: "💊" },
  { key: "restaurant",label: "Restaurant", emoji: "🍜" },
  { key: "shipping",  label: "Shipping",   emoji: "📦" },
  { key: "petcare",   label: "Pet Care",   emoji: "🐾" },
  { key: "hardware",  label: "Hardware",   emoji: "🔧" },
  { key: "bakery",    label: "Bakery & Coffee", emoji: "☕" },
  { key: "liquor",    label: "Liquor",     emoji: "🍷" },
  { key: "services",  label: "Services",   emoji: "🤝" },
];

type Merchant = {
  id: number;
  name: string;
  category: string;
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  status: string;
};

const BLANK = {
  name: "", category: "grocery", address: "",
  phone: "", hours: "", website: "",
};

export default function Directory() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    const url = activeCategory
      ? `/.netlify/functions/merchants-get?category=${activeCategory}`
      : "/.netlify/functions/merchants-get";
    const res = await fetch(url);
    setMerchants(await res.json());
  };

  useEffect(() => { load(); }, [activeCategory]);

  const submit = async () => {
    if (!form.name || !form.category) return;
    setSubmitting(true);
    await fetch("/.netlify/functions/merchants-create", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({ ...BLANK });
    setSubmitting(false);
    setSubmitted(true);
    setShowForm(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = merchants.filter(m => m.category === cat.key);
    if (items.length > 0) acc[cat.key] = items;
    return acc;
  }, {} as Record<string, Merchant[]>);

  const displayCategories = activeCategory
    ? CATEGORIES.filter(c => c.key === activeCategory)
    : CATEGORIES.filter(c => grouped[c.key]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f5f0e8;
          background-image:
            radial-gradient(circle at 15% 15%, rgba(134,193,134,0.12) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(255,200,120,0.12) 0%, transparent 50%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        .page { max-width: 680px; margin: 0 auto; padding: 28px 16px 100px; }

        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #2d4a2d; text-decoration: none; font-size: 0.88rem;
          font-weight: 500; margin-bottom: 20px; opacity: 0.65;
          transition: opacity 0.15s;
        }
        .back:hover { opacity: 1; }

        .header { margin-bottom: 24px; }
        .header h1 {
          font-family: 'Fraunces', serif; font-size: 1.9rem;
          color: #2d4a2d; font-weight: 700; line-height: 1.1;
        }
        .header p { color: #888; font-size: 0.9rem; margin-top: 6px; }

        /* Category filter strip */
        .cat-strip {
          display: flex; gap: 8px; overflow-x: auto;
          padding-bottom: 4px; margin-bottom: 24px;
          scrollbar-width: none;
        }
        .cat-strip::-webkit-scrollbar { display: none; }
        .cat-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 8px 14px; border-radius: 100px;
          border: 1.5px solid transparent;
          font-family: 'DM Sans', sans-serif; font-size: 0.83rem;
          font-weight: 500; cursor: pointer; white-space: nowrap;
          transition: all 0.15s; flex-shrink: 0;
        }
        .cat-btn.active { background: #2d4a2d; color: #f5f0e8; border-color: #2d4a2d; }
        .cat-btn.inactive { background: #fff; color: #555; border-color: #e0d8cc; }
        .cat-btn.inactive:hover { border-color: #7ab87a; color: #2d4a2d; }

        /* Add button */
        .add-btn {
          width: 100%; padding: 13px;
          background: #fff; color: #2d4a2d;
          border: 2px dashed #c8d8c8; border-radius: 14px;
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
          font-weight: 500; cursor: pointer; margin-bottom: 28px;
          transition: border-color 0.2s, background 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .add-btn:hover { border-color: #7ab87a; background: #f0f7f0; }

        /* Submit form */
        .form-card {
          background: #fff; border-radius: 18px; padding: 22px;
          box-shadow: 0 4px 20px rgba(45,74,45,0.1);
          border: 1px solid rgba(45,74,45,0.07);
          margin-bottom: 28px;
        }
        .form-title {
          font-family: 'Fraunces', serif; font-size: 1.15rem;
          color: #2d4a2d; margin-bottom: 16px;
        }
        .form-row { display: flex; gap: 10px; margin-bottom: 10px; }
        .form-row .f-input { margin-bottom: 0; }
        .f-input {
          display: block; width: 100%; padding: 11px 14px;
          margin-bottom: 10px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .f-input:focus {
          border-color: #7ab87a;
          box-shadow: 0 0 0 3px rgba(122,184,122,0.15);
          background: #fff;
        }
        .f-input::placeholder { color: #bbb; }
        select.f-input { cursor: pointer; }

        .form-actions { display: flex; gap: 10px; margin-top: 4px; }
        .btn-submit {
          flex: 1; padding: 12px; background: #2d4a2d; color: #f5f0e8;
          border: none; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          font-weight: 500; cursor: pointer; transition: background 0.15s;
        }
        .btn-submit:hover:not(:disabled) { background: #3d6b3d; }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-cancel {
          padding: 12px 18px; background: #f5f0e8; color: #666;
          border: none; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-cancel:hover { background: #e8e0d4; }

        .success-toast {
          background: #d4f0d4; color: #2d6a2d;
          border-radius: 10px; padding: 12px 16px;
          font-size: 0.88rem; font-weight: 500;
          margin-bottom: 20px; text-align: center;
        }

        /* Section heading */
        .section-head {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Fraunces', serif; font-size: 1.1rem;
          color: #2d4a2d; margin-bottom: 12px; margin-top: 8px;
        }

        /* Merchant cards */
        .merchant-grid {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 24px;
        }
        .merchant-card {
          background: #fff; border-radius: 14px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
          overflow: hidden; cursor: pointer;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .merchant-card:hover { box-shadow: 0 4px 18px rgba(45,74,45,0.1); transform: translateY(-1px); }
        .merchant-main {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 14px 16px; gap: 12px;
        }
        .merchant-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .merchant-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: #f0f7f0; display: flex; align-items: center;
          justify-content: center; font-size: 1.2rem; flex-shrink: 0;
        }
        .merchant-name {
          font-weight: 500; font-size: 0.97rem; color: #1a1a1a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .merchant-addr {
          font-size: 0.8rem; color: #999; margin-top: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .expand-icon {
          color: #aaa; font-size: 0.8rem; flex-shrink: 0;
          transition: transform 0.2s;
        }
        .expand-icon.open { transform: rotate(180deg); }

        /* Expanded detail */
        .merchant-detail {
          border-top: 1px solid #f0ece4;
          padding: 14px 16px;
          background: #faf8f4;
          display: flex; flex-direction: column; gap: 8px;
        }
        .detail-row {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 0.85rem; color: #555;
        }
        .detail-icon { font-size: 0.9rem; flex-shrink: 0; margin-top: 1px; }
        .detail-link {
          color: #2d4a2d; text-decoration: none; font-weight: 500;
        }
        .detail-link:hover { text-decoration: underline; }

        .empty {
          text-align: center; padding: 48px 20px; color: #aaa; font-size: 0.9rem;
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
      `}</style>

      <div className="page">
        <a href="/" className="back">← Home</a>

        <div className="header">
          <h1>Local Directory 📍</h1>
          <p>Stores, services, and everything in town</p>
        </div>

        {/* Category filter */}
        <div className="cat-strip">
          <button
            className={`cat-btn ${activeCategory === null ? "active" : "inactive"}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`cat-btn ${activeCategory === c.key ? "active" : "inactive"}`}
              onClick={() => setActiveCategory(activeCategory === c.key ? null : c.key)}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Add a place */}
        {!showForm && (
          <button className="add-btn" onClick={() => setShowForm(true)}>
            + Suggest a place or service
          </button>
        )}

        {submitted && (
          <div className="success-toast">
            ✅ Thanks! Your suggestion has been submitted for review.
          </div>
        )}

        {showForm && (
          <div className="form-card">
            <div className="form-title">Suggest a place 🗺️</div>

            <div className="form-row">
              <input
                className="f-input"
                placeholder="Name *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ flex: 2 }}
              />
              <select
                className="f-input"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ flex: 1 }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>

            <input
              className="f-input"
              placeholder="Address"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            />

            <div className="form-row">
              <input
                className="f-input"
                placeholder="Phone"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
              <input
                className="f-input"
                placeholder="Hours (e.g. Mon–Sat 9–6)"
                value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
              />
            </div>

            <input
              className="f-input"
              placeholder="Website or ordering app URL"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            />

            <div className="form-actions">
              <button
                className="btn-submit"
                onClick={submit}
                disabled={submitting || !form.name}
              >
                {submitting ? "Submitting…" : "Submit for Review"}
              </button>
              <button className="btn-cancel" onClick={() => { setShowForm(false); setForm({ ...BLANK }); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Listings */}
        {merchants.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏪</div>
            No listings yet{activeCategory ? " in this category" : ""} — be the first to suggest one!
          </div>
        ) : (
          displayCategories.map(cat => {
            const items = grouped[cat.key];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat.key}>
                <div className="section-head">
                  {cat.emoji} {cat.label}
                </div>
                <div className="merchant-grid">
                  {items.map(m => (
                    <div key={m.id} className="merchant-card">
                      <div
                        className="merchant-main"
                        onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                      >
                        <div className="merchant-left">
                          <div className="merchant-icon">
                            {CATEGORIES.find(c => c.key === m.category)?.emoji || "🏪"}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="merchant-name">{m.name}</div>
                            {m.address && <div className="merchant-addr">{m.address}</div>}
                          </div>
                        </div>
                        <span className={`expand-icon ${expandedId === m.id ? "open" : ""}`}>▼</span>
                      </div>

                      {expandedId === m.id && (
                        <div className="merchant-detail">
                          {m.phone && (
                            <div className="detail-row">
                              <span className="detail-icon">📞</span>
                              <a href={`tel:${m.phone}`} className="detail-link">{m.phone}</a>
                            </div>
                          )}
                          {m.hours && (
                            <div className="detail-row">
                              <span className="detail-icon">🕐</span>
                              <span>{m.hours}</span>
                            </div>
                          )}
                          {m.address && (
                            <div className="detail-row">
                              <span className="detail-icon">📍</span>
                              <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(m.address)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="detail-link"
                              >
                                {m.address}
                              </a>
                            </div>
                          )}
                          {m.website && (
                            <div className="detail-row">
                              <span className="detail-icon">🌐</span>
                              <a
                                href={m.website.startsWith("http") ? m.website : `https://${m.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="detail-link"
                              >
                                {m.website.replace(/^https?:\/\//, "")}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
