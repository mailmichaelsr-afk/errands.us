// app/login/page.tsx - With password reset

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/.netlify/identity/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (res.ok) {
        setResetSent(true);
      } else {
        throw new Error("Reset failed");
      }
    } catch (err: any) {
      setError("Failed to send reset email. Please try again.");
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
        .btn-secondary { background: #f5f0e8; color: #2d4a2d; border: 1.5px solid #e0d8cc; }
        .btn-secondary:hover { background: #e8e0d4; }
        .error { background: #ffe0e0; color: #c00; padding: 12px;
                 border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
        .success { background: #d4f0d4; color: #2d6a2d; padding: 12px;
                   border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
        .links { margin-top: 24px; text-align: center; }
        .link-item { margin: 12px 0; font-size: 0.9rem; }
        .link-item a, .link-item button { 
          color: #7ab87a; text-decoration: none; font-weight: 500; 
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .link-item a:hover, .link-item button:hover { text-decoration: underline; }
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
          {!showReset ? (
            <>
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
                  <button onClick={() => setShowReset(true)}>
                    Forgot password?
                  </button>
                </div>
                <div className="link-item">
                  New customer? <a href="/signup/customer">Sign up</a>
                </div>
                <div className="divider"></div>
                <div className="driver-cta">
                  <div className="driver-cta-title">Want to earn money?</div>
                  <div>
                    <a href="/driver-signup">Become a Driver →</a>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="title">Reset Password</div>

              {error && <div className="error">{error}</div>}
              {resetSent && (
                <div className="success">
                  ✅ Password reset email sent! Check your inbox and follow the link to reset your password.
                </div>
              )}

              {!resetSent && (
                <form onSubmit={handlePasswordReset}>
                  <p style={{ marginBottom: 16, fontSize: '0.9rem', color: '#666' }}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <input
                    className="input"
                    type="email"
                    placeholder="Email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowReset(false);
                      setResetSent(false);
                      setError("");
                    }}
                    style={{ marginTop: 12 }}
                  >
                    Back to Login
                  </button>
                </form>
              )}

              {resetSent && (
                <button 
                  className="btn" 
                  onClick={() => {
                    setShowReset(false);
                    setResetSent(false);
                    setError("");
                  }}
                >
                  Back to Login
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
