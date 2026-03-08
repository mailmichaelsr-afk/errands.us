// app/login/page.tsx - Updated with driver link

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/.netlify/identity/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant_type: "password", email, password }),
      });

      if (!res.ok) throw new Error("Invalid credentials");

      window.location.href = "/";
    } catch (err: any) {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 500px; margin: 0 auto; padding: 60px 20px; }
        .logo { font-family: 'Fraunces', serif; font-size: 2.5rem; font-weight: 700; 
                color: #2d4a2d; text-align: center; margin-bottom: 8px; }
        .logo span { color: #7ab87a; }
        .tagline { text-align: center; color: #888; font-size: 1rem; margin-bottom: 40px; }
        .card { background: #fff; border-radius: 16px; padding: 32px; 
                box-shadow: 0 4px 20px rgba(45,74,45,0.1); }
        .title { font-size: 1.5rem; font-weight: 600; color: #2d4a2d; 
                 margin-bottom: 24px; text-align: center; }
        .input { width: 100%; padding: 12px 14px; margin-bottom: 16px;
                 border: 1.5px solid #e0d8cc; border-radius: 11px;
                 font-size: 0.95rem; background: #faf8f4; outline: none; }
        .input:focus { border-color: #7ab87a; background: #fff; }
        .btn { width: 100%; padding: 14px; border-radius: 12px; border: none;
               background: #2d4a2d; color: #f5f0e8; font-size: 1rem;
               font-weight: 500; cursor: pointer; margin-top: 8px; }
        .btn:hover { background: #3d6b3d; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .error { background: #ffe0e0; color: #c00; padding: 12px;
                 border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
        .links { margin-top: 24px; text-align: center; }
        .link-item { margin: 12px 0; font-size: 0.9rem; }
        .link-item a { color: #7ab87a; text-decoration: none; font-weight: 500; }
        .link-item a:hover { text-decoration: underline; }
        .divider { height: 1px; background: #e0d8cc; margin: 20px 0; }
        .driver-cta {
          background: #f0f7f0; padding: 16px; border-radius: 10px;
          text-align: center; margin-top: 20px;
        }
        .driver-cta-title { font-weight: 600; color: #2d4a2d; margin-bottom: 8px; }
        .driver-cta a { color: #7ab87a; font-weight: 500; text-decoration: none; }
        .driver-cta a:hover { text-decoration: underline; }
      `}</style>

      <div className="page">
        <div className="logo">errand<span>s</span></div>
        <div className="tagline">Your neighborhood helping hands</div>

        <div className="card">
          <div className="title">Log In</div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleLogin}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="links">
            <div className="link-item">
              New customer? <a href="/signup">Sign up</a>
            </div>
            <div className="divider"></div>
            <div className="driver-cta">
              <div className="driver-cta-title">Want to earn money?</div>
              <div>
                <a href="/driver-signup">Become a Driver →</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
