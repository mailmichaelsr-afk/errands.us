// app/login/page.tsx - Using Netlify Identity widget

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [identity, setIdentity] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const netlifyIdentity = await import("netlify-identity-widget");
      const ni = netlifyIdentity.default;
      ni.init({ logo: false });
      setIdentity(ni);

      ni.on("login", () => {
        window.location.href = "/";
      });

      ni.on("error", (err: any) => {
        console.error("Login error:", err);
        setError(err.message || "Login failed");
        setLoading(false);
      });
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!identity) {
      setError("Loading...");
      return;
    }

    try {
      await identity.gotrue.login(email, password);
      // Success handled by "login" event
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
      setLoading(false);
    }
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
          margin-top: 24px; text-align: center;
        }
        .driver-cta-title { font-weight: 600; color: #2d4a2d; margin-bottom: 8px; }
        .driver-cta-text { font-size: 0.9rem; color: #666; margin-bottom: 12px; }
      `}</style>

      <div className="page">
        <div className="logo">errand<span>s</span></div>
        <p className="tagline">Community errands marketplace</p>

        <div className="card">
          <h1 className="title">Welcome back</h1>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleLogin}>
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="btn"
              disabled={loading || !identity}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="links">
            <div className="link-item">
              New customer? <a href="/signup">Sign up</a>
            </div>
          </div>
        </div>

        <div className="driver-cta">
          <div className="driver-cta-title">Want to earn money?</div>
          <div className="driver-cta-text">Help your neighbors with errands and get paid</div>
          <a href="/signup">
            <button className="btn">Become a Driver →</button>
          </a>
        </div>
      </div>
    </>
  );
}
