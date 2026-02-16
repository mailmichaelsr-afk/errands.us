"use client";
import { useEffect, useState } from "react";

export default function Runner() {
  const [requests, setRequests] = useState<any[]>([]);
  const [available, setAvailable] = useState(false);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"open" | "all">("open");

  const RUNNER_ID = 1; // placeholder until auth

  const load = async () => {
    const res = await fetch("/.netlify/functions/requests-get");
    setRequests(await res.json());
  };

  useEffect(() => { load(); }, []);

  const toggleAvailability = async () => {
    const next = !available;
    setAvailable(next);
    await fetch("/.netlify/functions/availability-set", {
      method: "POST",
      body: JSON.stringify({ runner_id: RUNNER_ID, is_available: next, note }),
    });
  };

  const accept = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch("/.netlify/functions/requests-accept", {
      method: "POST",
      body: JSON.stringify({ id, runner_id: RUNNER_ID }),
    });
    load();
  };

  const complete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch("/.netlify/functions/requests-complete", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    load();
  };

  const visible = filter === "open"
    ? requests.filter(r => r.status === "open")
    : requests;

  const statusColor: Record<string, string> = {
    open: "#d4f0d4",
    accepted: "#fdf3cc",
    completed: "#e8e8e8",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f5f0e8;
          background-image:
            radial-gradient(circle at 80% 10%, rgba(255,200,120,0.13) 0%, transparent 50%),
            radial-gradient(circle at 10% 90%, rgba(134,193,134,0.12) 0%, transparent 50%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        .page { max-width: 680px; margin: 0 auto; padding: 32px 20px 80px; }

        .back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #2d4a2d;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 24px;
          opacity: 0.7;
          transition: opacity 0.15s;
        }
        .back:hover { opacity: 1; }

        .header { margin-bottom: 28px; }
        .header h1 {
          font-family: 'Fraunces', serif;
          font-size: 2rem;
          color: #2d4a2d;
          font-weight: 700;
        }
        .header p {
          color: #888;
          font-size: 0.9rem;
          margin-top: 4px;
        }

        /* Availability toggle */
        .avail-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 28px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .avail-left { display: flex; align-items: center; gap: 14px; }
        .avail-dot {
          width: 12px; height: 12px;
          border-radius: 50%;
          transition: background 0.3s;
        }
        .avail-dot.on { background: #7ab87a; box-shadow: 0 0 0 3px rgba(122,184,122,0.3); }
        .avail-dot.off { background: #ccc; }
        .avail-text { font-size: 0.9rem; }
        .avail-text strong { color: #2d4a2d; display: block; }
        .avail-text span { color: #999; font-size: 0.8rem; }

        .toggle {
          position: relative;
          width: 48px; height: 26px;
          border: none; background: none; cursor: pointer; padding: 0;
          flex-shrink: 0;
        }
        .toggle-track {
          width: 48px; height: 26px;
          border-radius: 100px;
          transition: background 0.25s;
        }
        .toggle-track.on { background: #7ab87a; }
        .toggle-track.off { background: #ddd; }
        .toggle-thumb {
          position: absolute;
          top: 3px; width: 20px; height: 20px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: left 0.25s;
        }
        .toggle-thumb.on { left: 25px; }
        .toggle-thumb.off { left: 3px; }

        .note-input {
          width: 100%;
          margin-top: 14px;
          padding: 10px 14px;
          border: 1.5px solid #e0d8cc;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          background: #faf8f4;
          color: #2d2d2d;
          outline: none;
          transition: border-color 0.2s;
        }
        .note-input:focus { border-color: #7ab87a; }

        /* Filters */
        .filters {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .filter-btn {
          padding: 7px 16px;
          border-radius: 100px;
          border: 1.5px solid transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-btn.active { background: #2d4a2d; color: #f5f0e8; }
        .filter-btn.inactive { background: #fff; color: #666; border-color: #e0d8cc; }
        .filter-btn.inactive:hover { border-color: #7ab87a; color: #2d4a2d; }

        /* Request cards */
        .req-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 10px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .req-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(45,74,45,0.1);
        }
        .req-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .req-title {
          font-weight: 500;
          font-size: 1rem;
          color: #1a1a1a;
        }
        .status-pill {
          font-size: 0.73rem;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 100px;
          white-space: nowrap;
        }
        .req-route {
          font-size: 0.83rem;
          color: #888;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .req-actions { display: flex; gap: 8px; }

        .btn-accept {
          flex: 1;
          padding: 9px;
          background: #2d4a2d;
          color: #f5f0e8;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-accept:hover { background: #3d6b3d; }

        .btn-complete {
          flex: 1;
          padding: 9px;
          background: #7ab87a;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-complete:hover { background: #5fa05f; }

        .btn-view {
          padding: 9px 14px;
          background: #f5f0e8;
          color: #2d4a2d;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-view:hover { background: #e8e0d4; }

        .empty {
          text-align: center;
          padding: 48px 20px;
          color: #aaa;
          font-size: 0.95rem;
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }

        .section-head {
          font-family: 'Fraunces', serif;
          font-size: 1.2rem;
          color: #2d4a2d;
          margin-bottom: 14px;
        }
      `}</style>

      <div className="page">
        <a href="/" className="back">← Back to Requests</a>

        <div className="header">
          <h1>Runner Dashboard 🏃</h1>
          <p>Pick up open requests and help your neighbors out</p>
        </div>

        {/* Availability */}
        <div className="avail-card">
          <div className="avail-left">
            <div className={`avail-dot ${available ? "on" : "off"}`} />
            <div className="avail-text">
              <strong>{available ? "You're available" : "You're offline"}</strong>
              <span>{available ? "Neighbors can see you" : "Toggle on to start running"}</span>
            </div>
          </div>
          <button className="toggle" onClick={toggleAvailability}>
            <div className={`toggle-track ${available ? "on" : "off"}`} />
            <div className={`toggle-thumb ${available ? "on" : "off"}`} />
          </button>
          {available && (
            <input
              className="note-input"
              placeholder="Optional note (e.g. 'Available until 5pm, can carry heavy items')"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </div>

        {/* Filters */}
        <div className="filters">
          <button
            className={`filter-btn ${filter === "open" ? "active" : "inactive"}`}
            onClick={() => setFilter("open")}
          >
            Open ({requests.filter(r => r.status === "open").length})
          </button>
          <button
            className={`filter-btn ${filter === "all" ? "active" : "inactive"}`}
            onClick={() => setFilter("all")}
          >
            All Requests
          </button>
        </div>

        <div className="section-head">
          {filter === "open" ? "Available to pick up" : "All requests"}
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🌿</div>
            {filter === "open" ? "No open requests right now — check back soon!" : "No requests yet."}
          </div>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="req-card">
              <div className="req-top">
                <div className="req-title">{r.title}</div>
                <span
                  className="status-pill"
                  style={{ background: statusColor[r.status] || "#eee" }}
                >
                  {r.status}
                </span>
              </div>
              <div className="req-route">
                <span>📍 {r.pickup}</span>
                <span>→</span>
                <span>🏠 {r.dropoff}</span>
              </div>
              <div className="req-actions">
                {r.status === "open" && (
                  <button className="btn-accept" onClick={(e) => accept(r.id, e)}>
                    ✋ Accept
                  </button>
                )}
                {r.status === "accepted" && (
                  <button className="btn-complete" onClick={(e) => complete(r.id, e)}>
                    ✅ Mark Complete
                  </button>
                )}
                <button className="btn-view" onClick={() => location.href = `/request/${r.id}`}>
                  💬 Chat
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
