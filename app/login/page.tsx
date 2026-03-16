// app/login/page.tsx - Simple working login

"use client";
import { useState, useEffect } from "react";

export default function Login() {
  const [identity, setIdentity] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setDebugLog(prev => [...prev, "Loading identity widget..."]);
      const netlifyIdentity = await import("netlify-identity-widget");
      const ni = netlifyIdentity.default;
      ni.init({ logo: false });
      setIdentity(ni);
      setDebugLog(prev => [...prev, "Identity widget loaded"]);

      // Redirect on successful login
      ni.on("login", () => {
        setDebugLog(prev => [...prev, "Login successful!"]);
        ni.close();
        window.location.href = "/";
      });

      ni.on("error", (err: any) => {
        setDebugLog(prev => [...prev, `Identity error: ${err.message}`]);
        setError(err.message || "An error occurred");
        setLoading(false);
      });
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setDebugLog(prev => [...prev, "Starting login attempt..."]);

    try {
      if (!identity) {
        throw new Error("Identity widget not loaded yet");
      }

      setDebugLog(prev => [...prev, `Calling gotrue.login for ${email}...`]);
      await identity.gotrue.login(email, password, true);
      setDebugLog(prev => [...prev, "gotrue.login returned successfully"]);
      
      // Fallback: if login event doesn't fire in 2 seconds, redirect anyway
      setTimeout(() => {
        setDebugLog(prev => [...prev, "Timeout reached, forcing redirect..."]);
        window.location.href = "/";
      }, 2000);
      
      // Success is handled by the "login" event above
      
    } catch (err: any) {
      setDebugLog(prev => [...prev, `Login failed: ${err.message || err}`]);
      
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
          color: #1a1a1a;
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
        .debug {
          margin-top: 20px;
          padding: 12px;
          background: #f0f0f0;
          border-radius: 8px;
          font-size: 0.75rem;
          font-family: monospace;
          max-height: 200px;
          overflow-y: auto;
        }
        .debug-line {
          margin: 4px 0;
          color: #333;
        }
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

        {debugLog.length > 0 && (
          <div className="debug">
            <div style={{fontWeight: 'bold', marginBottom: '8px'}}>Debug Log:</div>
            {debugLog.map((log, i) => (
              <div key={i} className="debug-line">{log}</div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
