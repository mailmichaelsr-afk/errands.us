// app/signup/page.tsx
// Single unified signup for all user types

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Role = "customer" | "runner" | "territory_owner";

export default function UnifiedSignup() {
  const [role, setRole] = useState<Role>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOwnerInfo, setShowOwnerInfo] = useState(false);

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [desiredZip, setDesiredZip] = useState("");
  const [desiredSlots, setDesiredSlots] = useState<string[]>([]);
  const [why, setWhy] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [identity, setIdentity] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const netlifyIdentity = await import("netlify-identity-widget");
      const ni = netlifyIdentity.default;
      ni.init({ logo: false });
      setIdentity(ni);
    })();
  }, []);

  const toggleSlot = (slot: string) => {
    setDesiredSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (!street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setError("Address is required.");
      return;
    }
    if (role === "territory_owner" && !desiredZip.trim()) {
      setError("Please enter the ZIP code you want to own.");
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
      const signupResult = await identity.gotrue.signup(email.trim(), password, {
        full_name: name.trim(),
        phone: phone.trim(),
        role: role,
      });

      const userId = signupResult?.id || signupResult?.user?.id;

      if (userId) {
        const dbResponse = await fetch("/.netlify/functions/users-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            netlify_id: userId,
            email: email.trim(),
            full_name: name.trim(),
            phone: phone.trim(),
            role: role,
            status: "active",
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            zip: zip.trim(),
            ...(role === "customer" && {
              delivery_instructions: deliveryInstructions.trim(),
            }),
          }),
        });

        if (!dbResponse.ok) throw new Error("Failed to create user account");
      } else {
        throw new Error("Signup failed - no user ID");
      }

      setLoading(false);
      const message = role === "territory_owner"
        ? "✅ Application submitted! Check your email to confirm your account. You can start running errands right away while we review your territory application."
        : "✅ Account created! Check your email to confirm, then you can log in.";
      alert(message);
      router.push("/login");

    } catch (e: any) {
      setError(e.message || "Signup failed. Please try again.");
      setLoading(false);
    }
  };

  const roleInfo = {
    customer: { title: "Sign Up as Customer", subtitle: "Post errands and get help from neighbors" },
    runner: { title: "Become a Runner", subtitle: "Start earning money helping your neighbors" },
    territory_owner: { title: "Apply as Territory Owner", subtitle: "Own a territory and build your errands business" }
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
          color: #1a1a1a;
        }
        .card {
          background: #fff; border-radius: 20px; padding: 36px 28px;
          width: 100%; max-width: 500px;
          box-shadow: 0 4px 24px rgba(45,74,45,0.1);
          border: 1px solid rgba(45,74,45,0.06);
        }
        .logo { font-family: 'Fraunces', serif; font-size: 1.6rem; font-weight: 700; color: #2d4a2d; margin-bottom: 20px; }
        .logo span { color: #7ab87a; }
        .role-selector { display: flex; gap: 8px; margin-bottom: 24px; }
        .role-btn {
          flex: 1; padding: 12px; border: 2px solid #e0d8cc; border-radius: 10px;
          background: #faf8f4; cursor: pointer; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem; text-align: center;
          color: #2d4a2d;
        }
        .role-btn:hover { border-color: #7ab87a; }
        .role-btn.active { background: #2d4a2d; color: #f5f0e8; border-color: #2d4a2d; font-weight: 600; }
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
        .password-wrapper { position: relative; margin-bottom: 14px; }
        .password-wrapper .input { margin-bottom: 0; padding-right: 45px; }
        .toggle-password {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #999; cursor: pointer;
          font-size: 0.85rem; padding: 4px 8px; font-weight: 500;
        }
        .toggle-password:hover { color: #7ab87a; }
        .error { background: #fff0f0; color: #c44; padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; margin-bottom: 14px; }
        .coming-soon {
          background: #fff9e6; border: 1.5px solid #ffc107; border-radius: 10px;
          padding: 12px 14px; margin-bottom: 16px; font-size: 0.85rem; color: #7a5c00;
          display: flex; gap: 8px; align-items: flex-start; line-height: 1.5;
        }
        .owner-info {
          background: #f0f7f0; border: 1.5px solid #7ab87a; border-radius: 12px;
          margin-bottom: 20px; overflow: hidden;
        }
        .owner-info-toggle {
          width: 100%; padding: 14px 16px; background: none; border: none;
          display: flex; justify-content: space-between; align-items: center;
          cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
          font-weight: 600; color: #2d4a2d; text-align: left;
        }
        .owner-info-body { padding: 0 16px 16px; }
        .owner-info-item { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
        .owner-info-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 1px; }
        .owner-info-text { font-size: 0.84rem; color: #444; line-height: 1.5; }
        .owner-info-text strong { color: #2d4a2d; }
        .section-label { font-size: 0.78rem; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 10px; }
        .slot-grid { display: flex; gap: 8px; margin-bottom: 14px; }
        .slot-btn {
          flex: 1; padding: 12px 8px; border: 2px solid #e0d8cc; border-radius: 10px;
          background: #faf8f4; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem; text-align: center; color: #2d4a2d; transition: all 0.2s;
        }
        .slot-btn.active { background: #2d4a2d; color: #f5f0e8; border-color: #2d4a2d; font-weight: 600; }
        .slot-btn:hover:not(.active) { border-color: #7ab87a; }
        .slot-sub { font-size: 0.7rem; opacity: 0.75; margin-top: 3px; }
        .btn-primary {
          width: 100%; padding: 13px; background: #2d4a2d; color: #f5f0e8;
          border: none; border-radius: 11px; font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.2s; margin-top: 6px;
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
          <button className={`role-btn ${role === 'customer' ? 'active' : ''}`} onClick={() => setRole('customer')} type="button">
            <span className="role-btn-icon">🛒</span>
            Customer
          </button>
          <button className={`role-btn ${role === 'runner' ? 'active' : ''}`} onClick={() => setRole('runner')} type="button">
            <span className="role-btn-icon">🏃</span>
            Runner
          </button>
          <button className={`role-btn ${role === 'territory_owner' ? 'active' : ''}`} onClick={() => setRole('territory_owner')} type="button">
            <span className="role-btn-icon">📊</span>
            Owner
          </button>
        </div>

        <div className="heading">{roleInfo[role].title}</div>
        <p className="sub">{roleInfo[role].subtitle}</p>

        {role === "territory_owner" && (
          <>
            <div className="coming-soon">
              <span>⏳</span>
              <div>
                <strong>Territory ownership is coming soon.</strong> Submit your application now and we'll reach out when your area opens up. You can run errands as a runner right away.
              </div>
            </div>

            <div className="owner-info">
              <button className="owner-info-toggle" type="button" onClick={() => setShowOwnerInfo(!showOwnerInfo)}>
                <span>📖 What is a Territory Owner?</span>
                <span>{showOwnerInfo ? '▲' : '▼'}</span>
              </button>
              {showOwnerInfo && (
                <div className="owner-info-body">
                  {[
                    { icon: '📍', text: <><strong>A territory is a ZIP code + time slot.</strong> For example, you might own Oconto 54153 during morning hours — all requests in that area during your shift come to you first.</> },
                    { icon: '🔒', text: <><strong>Exclusive access.</strong> As a territory owner you get first access to every request in your ZIP during your time slot. No competing with other runners.</> },
                    { icon: '⏰', text: <><strong>You choose your time slots.</strong> Morning, afternoon, evening — or all day. You only lease the time you want to work.</> },
                    { icon: '💰', text: <><strong>Monthly lease fee.</strong> Territories are leased monthly. Pricing is based on your area and the time slots you choose.</> },
                    { icon: '🏃', text: <><strong>You're a runner too.</strong> Territory owners can run errands immediately while their application is being reviewed.</> },
                  ].map((item, i) => (
                    <div key={i} className="owner-info-item">
                      <span className="owner-info-icon">{item.icon}</span>
                      <div className="owner-info-text">{item.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <label>Full Name *</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />

        <label>Email *</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />

        <label>Phone</label>
        <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />

        <div className="section-label">Your Address</div>
        <label>Street Address *</label>
        <input className="input" value={street} onChange={e => setStreet(e.target.value)} placeholder="123 Main St" />
        <label>City *</label>
        <input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="Oconto" />
        <label>State *</label>
        <input className="input" value={state} onChange={e => setState(e.target.value)} placeholder="WI" maxLength={2} />
        <label>ZIP Code *</label>
        <input className="input" value={zip} onChange={e => setZip(e.target.value)} placeholder="54153" maxLength={5} />
        {role === "customer" && (
          <>
            <label>Delivery Instructions (optional)</label>
            <textarea className="textarea" value={deliveryInstructions} onChange={e => setDeliveryInstructions(e.target.value)}
              placeholder="e.g., Use back door, Ring doorbell twice, Gate code: 1234" style={{minHeight: '60px'}} />
          </>
        )}

        {role === "territory_owner" && (
          <>
            <div className="section-label">Territory Application</div>
            <label>Desired ZIP Code *</label>
            <input className="input" value={desiredZip} onChange={e => setDesiredZip(e.target.value)} placeholder="e.g. 54153" maxLength={5} />

            <label>Select Your Time Slots</label>
            <div style={{fontSize: '0.82rem', color: '#666', marginBottom: '12px', lineHeight: 1.5}}>
              Each hour is $1/month, billed annually. Select the hours you want to own in this territory.
            </div>

            {/* Quick select buttons */}
            <div style={{display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap'}}>
              {[
                { label: 'All Day', hours: Array.from({length: 24}, (_, i) => i) },
                { label: 'Morning (6am–12pm)', hours: [6,7,8,9,10,11] },
                { label: 'Afternoon (12pm–6pm)', hours: [12,13,14,15,16,17] },
                { label: 'Evening (6pm–12am)', hours: [18,19,20,21,22,23] },
              ].map(preset => (
                <button key={preset.label} type="button"
                  style={{
                    padding: '6px 12px', border: '1.5px solid #e0d8cc', borderRadius: '20px',
                    background: '#faf8f4', color: '#2d4a2d', fontSize: '0.78rem',
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                  }}
                  onClick={() => {
                    const allSelected = preset.hours.every(h => desiredSlots.includes(String(h)));
                    if (allSelected) {
                      setDesiredSlots(prev => prev.filter(s => !preset.hours.map(String).includes(s)));
                    } else {
                      setDesiredSlots(prev => [...new Set([...prev, ...preset.hours.map(String)])]);
                    }
                  }}>
                  {preset.label}
                </button>
              ))}
              <button type="button"
                style={{
                  padding: '6px 12px', border: '1.5px solid #ffaaaa', borderRadius: '20px',
                  background: '#fff0f0', color: '#c44', fontSize: '0.78rem',
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                }}
                onClick={() => setDesiredSlots([])}>
                Clear All
              </button>
            </div>

            {/* Hour grid */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '14px'}}>
              {Array.from({length: 24}, (_, i) => {
                const label = i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i-12}pm`;
                const selected = desiredSlots.includes(String(i));
                return (
                  <button key={i} type="button"
                    onClick={() => toggleSlot(String(i))}
                    style={{
                      padding: '8px 4px', border: `2px solid ${selected ? '#2d4a2d' : '#e0d8cc'}`,
                      borderRadius: '8px', background: selected ? '#2d4a2d' : '#faf8f4',
                      color: selected ? '#f5f0e8' : '#2d4a2d', fontSize: '0.75rem',
                      fontWeight: selected ? 700 : 400, cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                      textAlign: 'center',
                    }}>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Price summary */}
            <div style={{
              background: desiredSlots.length > 0 ? '#f0f7f0' : '#faf8f4',
              border: `1.5px solid ${desiredSlots.length > 0 ? '#7ab87a' : '#e0d8cc'}`,
              borderRadius: '10px', padding: '14px', marginBottom: '16px',
            }}>
              {desiredSlots.length === 0 ? (
                <div style={{color: '#999', fontSize: '0.85rem'}}>No time slots selected yet</div>
              ) : (
                <>
                  <div style={{fontWeight: 700, color: '#2d4a2d', fontSize: '0.95rem', marginBottom: '4px'}}>
                    {desiredSlots.length} slot{desiredSlots.length !== 1 ? 's' : ''} selected
                  </div>
                  <div style={{color: '#555', fontSize: '0.85rem'}}>
                    ${desiredSlots.length}/month · <strong>${desiredSlots.length * 12}/year</strong>
                  </div>
                </>
              )}
            </div>

            <label>Business Name (optional)</label>
            <input className="input" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="My Errands LLC" />

            <label>Why do you want to own this territory? (optional)</label>
            <textarea className="textarea" value={why} onChange={e => setWhy(e.target.value)}
              placeholder="Tell us about yourself and why you're interested..." />
          </>
        )}

        <label>Password *</label>
        <div className="password-wrapper">
          <input className="input" type={showPassword ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <label>Confirm Password *</label>
        <div className="password-wrapper">
          <input className="input" type={showPassword ? "text" : "password"} value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <button className="btn-primary" onClick={submit} disabled={loading || !identity}>
          {loading ? "Creating account..." : !identity ? "Loading..." : role === "territory_owner" ? "Submit Application" : "Sign Up"}
        </button>

        <div className="footer">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </div>
    </>
  );
}
