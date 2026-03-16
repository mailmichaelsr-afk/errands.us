// app/login/page.tsx - Simple working login

"use client";
import { useState, useEffect } from "react";

export default function Login() {
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

      // Redirect on successful login
      ni.on("login", () => {
        console.log("Login successful, redirecting...");
        ni.close();
        window.location.href = "/";
      });
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!identity) {
        throw new Error("Still loading, please wait...");
      }

      console.log("Attempting login...");
      await identity.gotrue.login(email, password, true);
      // Success is handled by the "login" event above
      
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Parse the error message
      let errorMsg = "Login failed. Please try again.";
      if (err.message) {
        if (err.message.includes("Email not confirmed")) {
          errorMsg = "Please confirm your email before logging in. Check your inbox.";
        } else if (err.message.includes("Invalid") || err.message.includes("credentials")) {
          errorMsg = "Invalid email or password.";
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          background: #f5f0e8; 
          min-height: 100vh; 
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card { 
          background: #fff; 
          border-radius: 20px; 
          padding: 40px 32px;
          width: 100%; 
          max-width: 440px;
          box-shadow: 0 4px 24px rgba(45,74,45,0.1);
        }
        .logo { 
          font-family: 'Fraunces', serif; 
          font-size: 2rem; 
          font-weight: 700; 
          color: #2d4a2d; 
          text-align: center; 
          margin-bottom: 8px; 
        }
        .logo span { color: #7ab87a; }
        .subtitle { 
          text-align: center; 
          color: #999; 
          font-size: 0.95rem; 
          margin-bottom: 32px; 
        }
        .input { 
          width: 100%; 
          padding: 12px 14px; 
          margin-bottom: 14px;
          border: 1.5px solid #e0d8cc; 
          border-radius: 11px;
          font-size: 0.95rem; 
          background: #faf8f4; 
          outline: none;
          font-family: 'DM Sans', sans-serif;
        }
        .input:focus { 
          border-color: #7ab87a; 
          background: #fff; 
          box-shadow: 0 0 0 3px rgba(122,184,122,0.1);
        }
        .btn { 
          width: 100%; 
          padding: 14px; 
          border-radius: 11px; 
          border: none;
          background: #2d4a2d; 
          color: #f5f0e8; 
          font-size: 1rem;
          font-weight: 500; 
          cursor: pointer; 
          margin-top: 8px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .btn:hover:not(:disabled) { background: #3d6b3d; }
        .btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
        }
        .error { 
          background: #ffe0e0; 
          color: #c00; 
          padding: 12px;
          border-radius: 10px; 
          margin-bottom: 16px; 
          font-size: 0.9rem;
          text-align: center;
        }
        .links { 
          margin-top: 24px; 
          text-align: center; 
        }
        .link-item { 
          margin: 10px 0; 
          font-size: 0.9rem; 
          color: #666;
        }
        .link-item a { 
          color: #7ab87a; 
          text-decoration: none; 
          font-weight: 500; 
        }
        .link-item a:hover { text-decoration: underline; }
      `}</style>

      <div className="card">
        <div className="logo">errand<span>s</span></div>
        <p className="subtitle">Welcome back</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(""); // Clear error when typing
            }}
            required
            disabled={loading}
          />
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(""); // Clear error when typing
            }}
            required
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn"
            disabled={loading || !identity}
          >
            {loading ? "Logging in..." : !identity ? "Loading..." : "Log in"}
          </button>
        </form>

        <div className="links">
          <div className="link-item">
            Don't have an account? <a href="/signup">Sign up</a>
          </div>
        </div>
      </div>
    </>
  );
}
