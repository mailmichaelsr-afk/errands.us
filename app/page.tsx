// app/page.tsx

"use client";
import { useEffect, useState } from "react";

type Req = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
  scheduled_time?: string;
};

export default function Home() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [title, setTitle] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);

  const load = async () => {
    const res = await fetch("/.netlify/functions/requests-get");
    setRequests(await res.json());
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title || !pickup || !dropoff) return;
    setLoading(true);
    await fetch("/.netlify/functions/requests-create", {
      method: "POST",
      body: JSON.stringify({ title, pickup, dropoff }),
    });
    setTitle(""); setPickup(""); setDropoff("");
    setLoading(false);
    setPosted(true);
    setTimeout(() => setPosted(false), 2500);
    load();
  };

  const statusColor: Record<string, string> = {
    open: "#d4f0d4",
    accepted: "#fdf3cc",
    completed: "#e8e8e8",
  };
  const statusLabel: Record<string, string> = {
    open: "🟢 Open",
    accepted: "🟡 In Progress",
    completed: "✅ Done",
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

        .page { max-width: 680px; margin: 0 auto; padding: 32px 20px 80px; }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 36px;
        }
        .logo {
          font-family: 'Fraunces', serif;
          font-size: 2rem;
          font-weight: 700;
          color: #2d4a2d;
          letter-spacing: -0.5px;
        }
        .logo span { color: #7ab87a; }
        .runner-link {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #2d4a2d;
          color: #f5f0e8;
          text-decoration: none;
          padding: 9px 16px;
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 500;
          transition: background 0.2s, transform 0.1s;
        }
        .runner-link:hover { background: #3d6b3d; transform: translateY(-1px); }

        /* Post card */
        .card {
          background: #fff;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 24px rgba(45,74,45,0.08);
          border: 1px solid rgba(45,74,45,0.06);
          margin-bottom: 36px;
        }
        .card-title {
          font-family: 'Fraunces', serif;
          font-size: 1.3rem;
          color: #2d4a2d;
          margin-bottom: 20px;
        }
        .input {
          display: block;
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 12px;
          border: 1.5px solid #e0d8cc;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          background: #faf8f4;
          color: #2d2d2d;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .input:focus {
          border-color: #7ab87a;
          box-shadow: 0 0 0 3px rgba(122,184,122,0.15);
          background: #fff;
        }
        .input::placeholder { color: #aaa; }
        .input-row { display: flex; gap: 10px; }
        .input-row .input { margin-bottom: 0; }

        .post-btn {
          margin-top: 14px;
          width: 100%;
          padding: 13px;
          background: #2d4a2d;
          color: #f5f0e8;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .post-btn:hover:not(:disabled) { background: #3d6b3d; transform: translateY(-1px); }
        .post-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .post-btn.success { background: #7ab87a; }

        /* Section heading */
        .section-head {
          font-family: 'Fraunces', serif;
          font-size: 1.4rem;
          color: #2d4a2d;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .count-badge {
          background: #7ab87a;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 100px;
        }

        /* Request cards */
        .request-card {
          background: #fff;
          border-radius: 16px;
          padding: 18px 20px;
          margin-bottom: 10px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }
        .request-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(45,74,45,0.1);
        }
        .req-title {
          font-weight: 500;
          font-size: 1rem;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .req-route {
          font-size: 0.83rem;
          color: #888;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .req-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .status-pill {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 100px;
          white-space: nowrap;
        }
        .open-btn {
          background: #f5f0e8;
          border: none;
          color: #2d4a2d;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .open-btn:hover { background: #e8e0d4; }

        .empty {
          text-align: center;
          padding: 48px 20px;
          color: #aaa;
          font-size: 0.95rem;
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
      `}</style>

      <div className="page">
        <header className="header">
          <div className="logo">errand<span>s</span></div>
          <a href="/runner" className="runner-link">
            🏃 Runner Mode
          </a>
        </header>

        <div className="card">
          <div className="card-title">Need a hand? 🤝</div>

          <input
            className="input"
            placeholder="What do you need? (e.g. pick up groceries)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="input-row">
            <input
              className="input"
              placeholder="📍 Pickup location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
            <input
              className="input"
              placeholder="🏠 Dropoff location"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
            />
          </div>

          <button
            className={`post-btn${posted ? " success" : ""}`}
            onClick={create}
            disabled={loading || !title || !pickup || !dropoff}
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
            No requests yet — be the first to post one!
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="request-card"
              onClick={() => (location.href = `/request/${r.id}`)}
            >
              <div>
                <div className="req-title">{r.title}</div>
                <div className="req-route">
                  <span>{r.pickup}</span>
                  <span>→</span>
                  <span>{r.dropoff}</span>
                </div>
              </div>
              <div className="req-right">
                <span
                  className="status-pill"
                  style={{ background: statusColor[r.status] || "#eee" }}
                >
                  {statusLabel[r.status] || r.status}
                </span>
                <button className="open-btn" onClick={(e) => { e.stopPropagation(); location.href = `/request/${r.id}`; }}>
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
