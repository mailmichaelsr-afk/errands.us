// app/reset-password/page.tsx - Password reset confirmation page

"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    // Get token from URL hash (Netlify Identity sends it as #recovery_token=...)
    const hash = window.location.hash;
    const tokenMatch = hash.match(/recovery_token=([^&]+)/);
    if (tokenMatch) {
      setToken(tokenMatch[1]);
    } else {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/.netlify/identity/user", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          password: password 
        }),
      });

      if (!res.ok) throw new Error("Reset failed");

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError("Failed to reset password. Please request a new reset link.");
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
        .subtitle { text-align: center; color: #666; font-size: 0.9rem; margin-bottom: 24px; }
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
        .success { background: #d4f0d4; color: #2d6a2d; padding: 12px;
                   border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; 
                   text-align: center; }
        .links { margin-top: 24px; text-align: center; }
        .links a { color: #7ab87a; text-decoration: none; font-weight: 500; font-size: 0.9rem; }
        .links a:hover { text-decoration: underline; }
      `}</style>

      <div className="page">
        <div className="logo">errand<span>s</span></div>
        <div className="tagline">Your neighborhood helping hands</div>

        <div className="card">
          <div className="title">Reset Password</div>

          {!token && !success && (
            <>
              {error && <div className="error">{error}</div>}
              <div className="links">
                <a href="/login">Back to Login</a>
              </div>
            </>
          )}

          {token && !success && (
            <>
              <div className="subtitle">Enter your new password</div>

              {error && <div className="error">{error}</div>}

              <form onSubmit={handleReset}>
                <input
                  className="input"
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>

              <div className="links">
                <a href="/login">Back to Login</a>
              </div>
            </>
          )}

          {success && (
            <>
              <div className="success">
                ✅ Password reset successful!<br/>
                Redirecting to login...
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
