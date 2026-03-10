// app/signup/driver/page.tsx

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function DriverSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [identity, setIdentity] = useState<any>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace("/driver");
  }, [user, router]);

  useEffect(() => {
    (async () => {
      const netlifyIdentity = await import("netlify-identity-widget");
      const ni = netlifyIdentity.default;
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
              role: "independent_driver",
            }),
          });
          router.replace("/driver");
        } catch (e) {
          console.error("Failed to create driver record:", e);
        }
      });

      // Handle email confirmation - auto close widget and redirect
      (ni as any).on("confirm", (u: any) => {
        ni.close();
        router.replace("/driver");
      });
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
      // Step 1: Create Netlify Identity account
      const signupResult = await identity.gotrue.signup(email.trim(), password, {
        full_name: name.trim(),
        phone: phone.trim(),
        role: "independent_driver",
      });

      // Step 2: Immediately create DB user
      if (signupResult && signupResult.id) {
        await fetch("/.netlify/functions/users-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            netlify_id: signupResult.id,
            email: email.trim(),
            full_name: name.trim(),
            phone: phone.trim(),
            role: "independent_driver",
          }),
        });
      }

      // Success
      setLoading(false);
      alert("✅ Account created! Please check your email to confirm your account, then you can log in.");
      router.push("/login");
      
    } catch (e: any) {
      console.error("Signup error:", e);
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
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .card {
          background: #fff; border-radius: 20px; padding: 36px 28px;
          width: 100%; max-width: 420px;
          box-shadow: 0 4px 24px rgba(45,74,45,0.1);
          border: 1px solid rgba(45,74,45,0.06);
        }
        .logo { font-family: 'Fraunces', serif; font-size: 1.6rem; font-weight: 700; color: #2d4a2d; margin-bottom: 4px; }
        .logo span { color: #7ab87a; }
        .heading { font-family: 'Fraunces', serif; font-size: 1.3rem; color: #2d4a2d; margin: 20px 0 6px; }
        .sub { color: #999; font-size: 0.88rem; margin-bottom: 24px; }
        label { display: block; font-size: 0.83rem; font-weight: 500; color: #555; margin-bottom: 5px; }
        .input {
          display: block; width: 100%; padding: 11px 14px; margin-bottom: 14px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input:focus { border-color: #7ab87a; box-shadow: 0 0 0 3px rgba(122,184,122,0.15); background: #fff; }
        .input::placeholder { color: #bbb; }
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
        .toggle-password:hover {
          color: #7ab87a;
        }
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
        .benefits {
          background: #f0f7f0; padding: 16px; border-radius: 10px; margin-top: 20px;
        }
        .benefits-title { font-weight: 600; color: #2d4a2d; margin-bottom: 8px; }
        .benefits ul { margin: 0; padding-left: 20px; }
        .benefits li { color: #555; font-size: 0.85rem; margin-bottom: 4px; }
      `}</style>
      <div className="card">
        <div className="logo">errand<span>s</span></div>
        <div className="heading">Become a Driver</div>
        <p className="sub">Start earning money helping your neighbors</p>

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
          {loading ? "Creating account..." : !identity ? "Loading..." : "Sign Up as Driver"}
        </button>

        <div className="footer">
          Already have an account? <a href="/login">Log in</a>
        </div>

        <div className="benefits">
          <div className="benefits-title">🚗 Driver Benefits:</div>
          <ul>
            <li>Work unclaimed territories - no approval needed</li>
            <li>Set your own schedule</li>
            <li>Get paid per job</li>
            <li>Build reputation to buy your own territory</li>
          </ul>
        </div>
      </div>
    </>
  );
}
