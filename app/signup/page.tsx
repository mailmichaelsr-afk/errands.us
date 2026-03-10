// app/signup/page.tsx
// Single unified signup for all user types

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Role = "customer" | "independent_driver" | "territory_owner";

export default function UnifiedSignup() {
  const [role, setRole] = useState<Role>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Territory owner extras
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
  }, [user, router]);

  useEffect(() => {
    (async () => {
      const netlifyIdentity = await import("netlify-identity-widget");
      const ni = netlifyIdentity.default;
      ni.init({ logo: false });
      setIdentity(ni);
    })();
  }, []);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!identity) {
      setError("Still loading, please try again in a moment.");
      return;
    }
    setError("");
    setLoading(true);
    
    try {
      console.log("Creating Netlify Identity account...");
      const signupResult = await identity.gotrue.signup(email.trim(), password, {
        full_name: name.trim(),
        phone: phone.trim(),
        role: role,
      });
      
      console.log("Signup result:", signupResult);
      const userId = signupResult?.id || signupResult?.user?.id;
      console.log("User ID:", userId);
      
      if (userId) {
        console.log("Creating DB user...");
        const dbResponse = await fetch("/.netlify/functions/users-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            netlify_id: userId,
            email: email.trim(),
            full_name: name.trim(),
            phone: phone.trim(),
            role: role,
            status: role === "territory_owner" ? "pending" : "active",
          }),
        });
        
        const dbResult = await dbResponse.json();
        console.log("DB creation result:", dbResult);
        
        if (!dbResponse.ok) {
          console.error("DB creation failed:", dbResult);
          throw new Error("Failed to create user account");
        }
      } else {
        console.error("No user ID found in signup result");
        throw new Error("Signup failed - no user ID");
      }

      setLoading(false);
      const message = role === "territory_owner" 
        ? "✅ Application submitted! Check your email to confirm, then we'll review your application."
        : "✅ Account created! Check your email to confirm, then you can log in.";
      alert(message);
      router.push("/login");
      
    } catch (e: any) {
      console.error("Signup error:", e);
      setError(e.message || "Signup failed. Please try again.");
      setLoading(false);
    }
  };

  const roleInfo = {
    customer: {
      title: "Sign Up as Customer",
      subtitle: "Post errands and get help from neighbors",
      icon: "🛒"
    },
    independent_driver: {
      title: "Become a Driver",
      subtitle: "Start earning money helping your neighbors",
      icon: "🚗"
    },
    territory_owner: {
      title: "Apply as Territory Owner",
      subtitle: "Run your own errands business",
      icon: "📊"
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
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .card {
          background: #fff; border-radius: 20px; padding: 36px 28px;
          width: 100%; max-width: 500px;
          box-shadow: 0 4px 24px rgba(45,74,45,0.1);
          border: 1px solid rgba(45,74,45,0.06);
        }
        .logo { font-family: 'Fraunces', serif; font-size: 1.6rem; font-weight: 700; color: #2d4a2d; margin-bottom: 20px; }
        .logo span { color: #7ab87a; }
        
        .role-selector {
          display: flex; gap: 8px; margin-bottom: 24px;
        }
        .role-btn {
          flex: 1; padding: 12px; border: 2px solid #e0d8cc; border-radius: 10px;
          background: #faf8f4; cursor: pointer; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
          text-align: center;
        }
        .role-btn:hover { border-color: #7ab87a; }
        .role-btn.active { 
          background: #2d4a2d; color: #f5f0e8; border-color: #2d4a2d;
          font-weight: 600;
        }
        .role-btn-icon { font-size: 1.4rem; display: block; margin-bottom: 4px; }
        
        .heading { font-family: 'Fraunces', serif; font-size: 1.3rem; color: #2d4a2d; margin-bottom: 6px; }
        .sub { color: #999; font-size: 0.88rem; margin-bottom: 24px; }
        
        label { display: block; font-size: 0.83rem; font-weight: 500; color: #555; margin-bottom: 5px; }
        .input, .textarea {
          display: block; width: 100%; padding: 11px 14px; margin-bottom: 14px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .textarea { min-height: 80px; resize: vertical; }
        .input:focus, .textarea:focus { border-color: #7ab87a; box-shadow: 0 0 0 3px rgba(122,184,122,0.15); background: #fff; }
        .input::placeholder, .textarea::placeholder { color: #bbb; }
        
        .password-wrapper {
          position: relative;
          margin-bottom: 14px;
        }
        .password-wrapper .input {
          margin-bottom: 0;
          padding-right: 45px;
        }
        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 4px 8px;
          font-weight: 500;
        }
        .toggle-password:hover { color: #7ab87a; }
        
        .error { background: #fff0f0; color: #c44; padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; margin-bottom: 14px; }
        .notice {
          background: #fff9e6; border-left: 3px solid #ffc107;
          padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.85rem; color: #666;
        }
        
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
      `}</style>
      
      <div className="card">
        <div className="logo">errand<span>s</span></div>
        
        <div className="role-selector">
          <button 
            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')}
            type="button"
          >
            <span className="role-btn-icon">🛒</span>
            Customer
          </button>
          <button 
            className={`role-btn ${role === 'independent_driver' ? 'active' : ''}`}
            onClick={() => setRole('independent_driver')}
            type="button"
          >
            <span className="role-btn-icon">🚗</span>
            Driver
          </button>
          <button 
            className={`role-btn ${role === 'territory_owner' ? 'active' : ''}`}
            onClick={() => setRole('territory_owner')}
            type="button"
          >
            <span className="role-btn-icon">📊</span>
            Owner
          </button>
        </div>

        <div className="heading">{roleInfo[role].title}</div>
        <p className="sub">{roleInfo[role].subtitle}</p>

        {role === "territory_owner" && (
          <div className="notice">
            ⏳ Your application will be reviewed by our team. You'll be notified once approved.
          </div>
        )}

        <label>Full Name *</label>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="John Doe"
        />

        <label>Email *</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label>Phone</label>
        <input
          className="input"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />

        {role === "territory_owner" && (
          <>
            <label>Business Name (optional)</label>
            <input
              className="input"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="My Errands LLC"
            />

            <label>Desired ZIP Code (optional)</label>
            <input
              className="input"
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
              placeholder="90210"
            />

            <label>Why do you want to be a territory owner? (optional)</label>
            <textarea
              className="textarea"
              value={why}
              onChange={e => setWhy(e.target.value)}
              placeholder="Tell us about your experience..."
            />
          </>
        )}

        <label>Password *</label>
        <div className="password-wrapper">
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <label>Confirm Password *</label>
        <div className="password-wrapper">
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <button
          className="btn-primary"
          onClick={submit}
          disabled={loading || !identity}
        >
          {loading ? "Creating account..." : !identity ? "Loading..." : "Sign Up"}
        </button>

        <div className="footer">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </div>
    </>
  );
}
