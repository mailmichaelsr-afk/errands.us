// app/login/page.tsx

"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading]);

  useEffect(() => {
    if (!loading) login();
  }, [loading]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f0e8;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(134,193,134,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,200,120,0.12) 0%, transparent 50%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center;
        }
        .wrap { text-align: center; padding: 40px 20px; }
        .logo { font-family: 'Fraunces', serif; font-size: 2.2rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .sub { color: #999; margin-top: 8px; font-size: 0.95rem; }
        .spinner {
          margin: 32px auto 0;
          width: 32px; height: 32px;
          border: 3px solid #e0d8cc;
          border-top-color: #7ab87a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .manual-btn {
          margin-top: 24px;
          background: #2d4a2d; color: #f5f0e8;
          border: none; border-radius: 12px;
          padding: 12px 28px;
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500;
          cursor: pointer; transition: background 0.2s;
        }
        .manual-btn:hover { background: #3d6b3d; }
        .signup-links { margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .signup-link {
          color: #7ab87a; text-decoration: none; font-size: 0.88rem; font-weight: 500;
        }
        .signup-link:hover { text-decoration: underline; }
      `}</style>
      <div className="wrap">
        <div className="logo">errand<span>s</span></div>
        <p className="sub">Sign in to your account</p>
        <div className="spinner" />
        <button className="manual-btn" onClick={login}>Open Sign In</button>
        <div className="signup-links">
          <a href="/signup/customer" className="signup-link">New? Sign up as a Customer</a>
          <span style={{color:"#ccc"}}>·</span>
          <a href="/signup/territory-owner" className="signup-link">Apply to be a Territory Owner</a>
        </div>
      </div>
    </>
  );
}
