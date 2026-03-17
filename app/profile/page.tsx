// app/profile/page.tsx - User profile editor

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, dbUserId, loading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (dbUserId) loadProfile();
  }, [dbUserId]);

  const loadProfile = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/.netlify/functions/users-get?id=${dbUserId}`);
      if (res.ok) {
        const data = await res.json();
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setStreet(data.street || "");
        setCity(data.city || "");
        setState(data.state || "");
        setZip(data.zip || "");
        setDeliveryInstructions(data.delivery_instructions || "");
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
    setLoadingData(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/.netlify/functions/users-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: dbUserId,
          full_name: fullName,
          phone,
          street,
          city,
          state,
          zip,
          delivery_instructions: deliveryInstructions,
        }),
      });

      if (res.ok) {
        setMessage("✅ Profile updated successfully!");
      } else {
        throw new Error("Update failed");
      }
    } catch (e: any) {
      setMessage("❌ Failed to update profile");
    }
    setSaving(false);
  };

  if (loading || loadingData) {
    return (
      <div style={{padding: '40px', textAlign: 'center', color: '#999'}}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f0e8;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
        }
        .page {
          max-width: 600px;
          margin: 0 auto;
        }
        .back {
          display: inline-block;
          color: #7ab87a;
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 20px;
        }
        .back:hover { text-decoration: underline; }
        .card {
          background: #fff;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(45,74,45,0.1);
        }
        .title {
          font-family: 'Fraunces', serif;
          font-size: 1.8rem;
          color: #2d4a2d;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #999;
          font-size: 0.9rem;
          margin-bottom: 28px;
        }
        .section {
          margin-bottom: 24px;
        }
        .section-title {
          font-weight: 600;
          color: #2d4a2d;
          margin-bottom: 12px;
          font-size: 1.05rem;
        }
        label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: #555;
          margin-bottom: 6px;
        }
        .input, .textarea {
          display: block;
          width: 100%;
          padding: 11px 14px;
          margin-bottom: 14px;
          border: 1.5px solid #e0d8cc;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.93rem;
          background: #faf8f4;
          color: #1a1a1a;
          outline: none;
          transition: all 0.2s;
        }
        .input:focus, .textarea:focus {
          border-color: #7ab87a;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(122,184,122,0.1);
        }
        .textarea {
          min-height: 80px;
          resize: vertical;
        }
        .btn {
          padding: 13px 24px;
          border-radius: 11px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #2d4a2d;
          color: #f5f0e8;
          width: 100%;
        }
        .btn-primary:hover:not(:disabled) { background: #3d6b3d; }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .message {
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 0.9rem;
          text-align: center;
        }
        .message.success {
          background: #d4f0d4;
          color: #2d6a2d;
        }
        .message.error {
          background: #ffe0e0;
          color: #c00;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
        }
      `}</style>

      <div className="page">
        <a href="/" className="back">← Back to Home</a>

        <div className="card">
          <div className="title">Profile Settings</div>
          <div className="subtitle">Update your information and delivery preferences</div>

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="section">
            <div className="section-title">Personal Information</div>
            
            <label>Full Name</label>
            <input
              className="input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="John Doe"
            />

            <label>Phone</label>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />

            <label>Email (cannot be changed)</label>
            <input
              className="input"
              value={(user as any)?.email || ""}
              disabled
              style={{background: '#f0f0f0', cursor: 'not-allowed'}}
            />
          </div>

          <div className="section">
            <div className="section-title">Default Delivery Address</div>
            
            <label>Street Address</label>
            <input
              className="input"
              value={street}
              onChange={e => setStreet(e.target.value)}
              placeholder="123 Main St"
            />

            <label>City</label>
            <input
              className="input"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Madison"
            />

            <div className="grid-2">
              <div>
                <label>State</label>
                <input
                  className="input"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="WI"
                  maxLength={2}
                  style={{marginBottom: 0}}
                />
              </div>
              <div>
                <label>ZIP Code</label>
                <input
                  className="input"
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                  placeholder="54153"
                  maxLength={5}
                  style={{marginBottom: 0}}
                />
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Delivery Instructions</div>
            
            <label>Special Instructions (optional)</label>
            <textarea
              className="textarea"
              value={deliveryInstructions}
              onChange={e => setDeliveryInstructions(e.target.value)}
              placeholder="e.g., Use back door, Ring doorbell twice, Gate code: 1234"
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={saveProfile}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}
