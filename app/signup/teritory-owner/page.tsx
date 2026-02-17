// app/signup/territory-owner/page.tsx

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function TerritoryOwnerSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [why, setWhy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [identity, setIdentity] = useState<any>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace("/");
  }, [user]);

  useEffect(() => {
    import("netlify-identity-widget").then((mod) => {
      const ni = mod.default;
      ni.init({ logo: false });
      setIdentity(ni);
      ni.on("login", async (u: any) => {
        try {
          await fetch("/.netlify/functions/users-create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              netlify_id: u.id,
              email: u.email,
              full_name: name,
              phone,
              role: "territory_owner",
              business_name: businessName,
              desired_zip: zipCode,
              application_notes: why,
              status: "pending",  // needs admin approval
            }),
          });
        } catch (e) {
          console.error("Failed to create user record:", e);
        }
        router.replace("/application-submitted");
      });
    });
  }, [name, phone, businessName, zipCode, why]);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
      setError("Name, email, phone, and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await identity.signup(email.trim(), password, {
        full_name: name.trim(),
        phone: phone.trim(),
        business_name: businessName.trim(),
        role: "territory_owner",
      });
    } catch (e: any) {
      setError(e.message || "Signup failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f0e8;
          background-image: radial-gradient(circle at 20% 20%, rgba(134,193,134,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,200,120,0.12) 0%, transparent 50%);
          min-height: 100vh; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; padding: 40px 20px;
        }
        .card {
          background: #fff; border-radius: 20px; padding: 36px 28px;
          width: 100%; max-width: 520px;
          box-shadow: 0 4px 24px rgba(45,74,45,0.1);
          border: 1px solid rgba(45,74,45,0.06);
        }
        .logo { font-family: 'Fraunces', serif; font-size: 1.6rem; font-weight: 700; color: #2d4a2d; margin-bottom: 4px; }
        .logo span { color: #7ab87a; }
        .heading { font-family: 'Fraunces', serif; font-size: 1.3rem; color: #2d4a2d; margin: 20px 0 6px; }
        .sub { color: #999; font-size: 0.88rem; margin-bottom: 24px; line-height: 1.5; }
        label { display: block; font-size: 0.83rem; font-weight: 500; color: #555; margin-bottom: 5px; }
        .input, .textarea {
          display: block; width: 100%; padding: 11px 14px; margin-bottom: 14px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .textarea { min-height: 100px; resize: vertical; }
        .input:focus, .textarea:focus { border-color: #7ab87a; box-shadow: 0 0 0 3px rgba(122,184,122,0.15); background: #fff; }
        .input::placeholder, .textarea::placeholder { color: #bbb; }
        .error { background: #fff0f0; color: #c44; padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; margin-bottom: 14px; }
        .btn-primary {
          width: 100%; padding: 13px; background: #2d4a2d; color: #f5f0e8;
          border: none; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
          font-weight: 500; cursor: pointer; transition: background 0.2s;
          margin-top: 6px;
        }
        .btn-primary:hover:not(:disabled) { background: #3d6b3d; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.88rem; color: #999; }
        .footer a { color: #7ab87a; text-decoration: none; font-weight: 500; }
        .footer a:hover { text-decoration: underline; }
        .row { display: flex; gap: 10px; }
        .row .input { margin-bottom: 0; }
      `}</style>
      <div className="card">
        <div className="logo">errand<span>s</span></div>
        <div className="heading">Apply as a Territory Owner</div>
        <p className="sub">Own your local territory, build your business, serve your community</p>

        <label>Full Name *</label>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="John Doe"
        />

        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Email *</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Phone *</label>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <label>Password *</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <label>Business Name (optional)</label>
        <input
          className="input"
          value={businessName}
          onChange={e => setBusinessName(e.target.value)}
          placeholder="Your Errand Service LLC"
        />

        <label>Desired Zip Code / Area</label>
        <input
          className="input"
          value={zipCode}
          onChange={e => setZipCode(e.target.value)}
          placeholder="90210"
        />

        <label>Why do you want to be a territory owner?</label>
        <textarea
          className="textarea"
          value={why}
          onChange={e => setWhy(e.target.value)}
          placeholder="Tell us about your background and why you're interested..."
        />

        {error && <div className="error">{error}</div>}

        <button
          className="btn-primary"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Submitting application..." : "Submit Application"}
        </button>

        <div className="footer">
          Already have an account? <a href="/login">Log in</a><br />
          Just need errands done? <a href="/signup/customer">Sign up as a Customer</a>
        </div>
      </div>
    </>
  );
}
