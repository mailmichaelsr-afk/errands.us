// app/driver-signup/page.tsx - Driver instant signup

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DriverSignup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create Netlify Identity user
      const netlifyRes = await fetch("/.netlify/identity/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!netlifyRes.ok) throw new Error("Signup failed");

      // Create database user as independent_driver
      const dbRes = await fetch("/.netlify/functions/users-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          full_name: fullName,
          phone,
          role: "independent_driver",
        }),
      });

      if (!dbRes.ok) throw new Error("Database user creation failed");

      alert("✅ Driver account created! Please check your email to confirm, then log in.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Signup failed");
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
        .title { font-family: 'Fraunces', serif; font-size: 1.5rem; 
                 color: #2d4a2d; margin-bottom: 24px; text-align: center; }
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
        .link { text-align: center; margin-top: 20px; font-size: 0.9rem; }
        .link a { color: #7ab87a; text-decoration: none; font-weight: 500; }
        .link a:hover { text-decoration: underline; }
        .info { background: #e6f0ff; padding: 16px; border-radius: 10px;
                margin-bottom: 20px; font-size: 0.88rem; color: #0056b3; }
      `}</style>

      <div className="page">
        <div className="logo">errand<span>s</span></div>
        <div className="tagline">Become a Driver</div>

        <div className="card">
          <div className="title">Driver Signup</div>
          
          <div className="info">
            ✓ Instant approval - start taking jobs immediately<br/>
            ✓ Work when you want<br/>
            ✓ Choose your own jobs<br/>
            ✓ Option to buy your own territory later
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleSignup}>
            <input
              className="input"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
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
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up as Driver"}
            </button>
          </form>

          <div className="link">
            Already have an account? <a href="/login">Log in</a>
          </div>
        </div>
      </div>
    </>
  );
}
