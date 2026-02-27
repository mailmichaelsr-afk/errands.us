// app/page.tsx (requests only visible to territory owners)

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Request = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
  created_at: string;
};

export default function Home() {
  const { user, isTerritoryOwner, loading } = useAuth();
  const router = useRouter();
  const [reqs, setReqs] = useState<Request[]>([]);
  const [title, setTitle] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const load = async () => {
    // Only territory owners can see requests
    if (!isTerritoryOwner) return;
    
    try {
      const res = await fetch("/.netlify/functions/requests-get");
      if (res.ok) setReqs(await res.json());
    } catch (e) {
      console.error("Failed to load:", e);
    }
  };

  useEffect(() => {
    if (user && isTerritoryOwner) load();
  }, [user, isTerritoryOwner]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pickup || !dropoff) return;

    setSubmitting(true);
    try {
      await fetch("/.netlify/functions/requests-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, pickup, dropoff }),
      });
      setTitle("");
      setPickup("");
      setDropoff("");
      load();
    } catch (e) {
      console.error("Submit failed:", e);
    }
    setSubmitting(false);
  };

  // Show nothing while checking auth
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

  // Don't render anything if not logged in (will redirect)
  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f0e8;
          background-image:
            radial-gradient(circle at 70% 5%, rgba(255,200,120,0.12) 0%, transparent 45%),
            radial-gradient(circle at 20% 95%, rgba(134,193,134,0.1) 0%, transparent 45%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }
        .page { max-width: 640px; margin: 0 auto; padding: 28px 20px 80px; }
        .hero {
          text-align: center; margin-bottom: 32px;
        }
        .logo { font-family: 'Fraunces', serif; font-size: 2.2rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .tagline {
          font-size: 0.95rem; color: #888; margin-top: 6px;
        }

        .card {
          background: #fff; border-radius: 16px; padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .card-title {
          font-family: 'Fraunces', serif; font-size: 1.2rem;
          color: #2d4a2d; margin-bottom: 16px; font-weight: 600;
        }
        .form-group { margin-bottom: 14px; }
        .label {
          display: block; font-size: 0.88rem; color: #555;
          font-weight: 500; margin-bottom: 6px;
        }
        .input {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .input:focus {
          border-color: #7ab87a;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(122,184,122,0.1);
        }
        .input::placeholder { color: #bbb; }
        .btn {
          width: 100%; padding: 13px; border-radius: 12px;
          border: none; background: #2d4a2d; color: #f5f0e8;
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
          font-weight: 500; cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .btn:hover { background: #3d6b3d; }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .req-list { display: flex; flex-direction: column; gap: 12px; }
        .req-item {
          background: #faf8f4; padding: 16px; border-radius: 12px;
          border: 1px solid #e8e0d4;
          transition: all 0.2s;
          cursor: pointer;
        }
        .req-item:hover {
          background: #fff;
          box-shadow: 0 4px 12px rgba(45,74,45,0.08);
        }
        .req-title { font-weight: 600; font-size: 0.95rem; color: #2d4a2d; margin-bottom: 6px; }
        .req-route { font-size: 0.85rem; color: #888; }
        .empty { text-align: center; padding: 40px 20px; color: #bbb; font-size: 0.9rem; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }

        .user-info {
          text-align: center;
          padding: 12px;
          background: #fff;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 0.88rem;
          color: #666;
        }

        .nav-links {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .nav-link {
          flex: 1;
          padding: 10px;
          background: #fff;
          border: 1.5px solid #e0d8cc;
          border-radius: 10px;
          text-align: center;
          text-decoration: none;
          color: #2d4a2d;
          font-size: 0.88rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .nav-link:hover {
          border-color: #7ab87a;
          background: #f0f7f0;
        }
      `}</style>

      <div className="page">
        <div className="hero">
          <div className="logo">errand<span>s</span></div>
          <div className="tagline">Your neighborhood helping hands</div>
        </div>

        <div className="user-info">
          👤 {user?.user_metadata?.full_name || user?.email}
        </div>

        <div className="nav-links">
          <a href="/directory" className="nav-link">🏪 Merchants</a>
          {isTerritoryOwner && <a href="/owner" className="nav-link">📊 Dashboard</a>}
        </div>

        <div className="card">
          <div className="card-title">Post a Request</div>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="label">What do you need?</label>
              <input
                className="input"
                placeholder="e.g. Pick up prescription from CVS"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Pickup from</label>
              <input
                className="input"
                placeholder="Store name or address"
                value={pickup}
                onChange={e => setPickup(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Deliver to</label>
              <input
                className="input"
                placeholder="Your address"
                value={dropoff}
                onChange={e => setDropoff(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Posting..." : "Post Request"}
            </button>
          </form>
        </div>

        {/* Only show requests to territory owners */}
        {isTerritoryOwner && (
          <div className="card">
            <div className="card-title">Recent Requests</div>
            {reqs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📦</div>
                No requests yet.
              </div>
            ) : (
              <div className="req-list">
                {reqs.slice(0, 10).map(r => (
                  <div
                    key={r.id}
                    className="req-item"
                    onClick={() => router.push(`/request/${r.id}`)}
                  >
                    <div className="req-title">{r.title}</div>
                    <div className="req-route">
                      📍 {r.pickup} → 🏠 {r.dropoff}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
