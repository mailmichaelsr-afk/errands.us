// app/page.tsx - Complete with structured addresses and merchant dropdown

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Request = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
  customer_id?: number;
  assigned_to?: number;
  offered_amount?: number;
  pickup_flexibility?: string;
  created_at: string;
  message_count?: number;
  last_message?: string;
};

type Merchant = {
  id: number;
  name: string;
  category: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

export default function Home() {
  const { user, dbUserId, isTerritoryOwner, isCustomer, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [pickupStreet, setPickupStreet] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupState, setPickupState] = useState("");
  const [pickupZip, setPickupZip] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryZip, setDeliveryZip] = useState("");
  const [pickupFlexibility, setPickupFlexibility] = useState("flexible");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryFlexibility, setDeliveryFlexibility] = useState("flexible");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [offeredAmount, setOfferedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  
  // Merchant selection
  const [selectedMerchant, setSelectedMerchant] = useState<number | null>(null);
  const [availableMerchants, setAvailableMerchants] = useState<Merchant[]>([]);
  const [useCustomPickup, setUseCustomPickup] = useState(false);
  const [territory, setTerritory] = useState<any>(null);
  
  const [submitting, setSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch merchants when delivery ZIP changes
  useEffect(() => {
    const fetchMerchants = async () => {
      if (deliveryZip.length === 5) {
        try {
          const res = await fetch(`/.netlify/functions/merchants-by-zip?zip=${deliveryZip}`);
          if (res.ok) {
            const data = await res.json();
            setTerritory(data.territory);
            setAvailableMerchants(data.merchants);
          }
        } catch (e) {
          console.error("Failed to load merchants:", e);
        }
      } else {
        setAvailableMerchants([]);
        setTerritory(null);
      }
    };
    
    fetchMerchants();
  }, [deliveryZip]);

  // Auto-fill pickup address when merchant selected
  useEffect(() => {
    if (selectedMerchant && availableMerchants.length > 0) {
      const merchant = availableMerchants.find(m => m.id === selectedMerchant);
      if (merchant) {
        setPickupStreet(merchant.street || "");
        setPickupCity(merchant.city || "");
        setPickupState(merchant.state || "");
        setPickupZip(merchant.zip || "");
        setUseCustomPickup(false);
      }
    }
  }, [selectedMerchant, availableMerchants]);

  const load = async () => {
    try {
      const res = await fetch("/.netlify/functions/requests-get");
      if (res.ok) {
        const data = await res.json();
        
        // Load message counts for each request
        const requestsWithMessages = await Promise.all(
          data.map(async (req: Request) => {
            try {
              const msgRes = await fetch(`/.netlify/functions/messages-get?id=${req.id}`);
              if (msgRes.ok) {
                const messages = await msgRes.json();
                return {
                  ...req,
                  message_count: messages.length,
                  last_message: messages.length > 0 ? messages[messages.length - 1].body : null
                };
              }
            } catch (e) {
              console.error(`Failed to load messages for request ${req.id}:`, e);
            }
            return req;
          })
        );
        
        setAllRequests(requestsWithMessages);
        
        // Filter to show only user's requests if customer
        if (dbUserId) {
          const mine = requestsWithMessages.filter((r: Request) => r.customer_id === dbUserId);
          setMyRequests(mine);
        }
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }
  };

  useEffect(() => {
    if (user) {
      load();
      const interval = setInterval(load, 10000);
      return () => clearInterval(interval);
    }
  }, [user, dbUserId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deliveryZip) {
      alert("Title and delivery ZIP code are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/.netlify/functions/requests-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title,
          description: "",
          customer_id: dbUserId,
          pickup_street: pickupStreet,
          pickup_city: pickupCity,
          pickup_state: pickupState,
          pickup_zip: pickupZip,
          delivery_street: deliveryStreet,
          delivery_city: deliveryCity,
          delivery_state: deliveryState,
          delivery_zip: deliveryZip,
          pickup_time: pickupTime || null,
          pickup_flexibility: pickupFlexibility,
          delivery_time: deliveryTime || null,
          delivery_flexibility: deliveryFlexibility,
          offered_amount: offeredAmount ? parseFloat(offeredAmount) : null,
          payment_method: paymentMethod,
          payment_notes: paymentNotes || null,
        }),
      });

      if (res.ok) {
        const newRequest = await res.json();
        
        // Clear form
        setTitle("");
        setPickupStreet("");
        setPickupCity("");
        setPickupState("");
        setPickupZip("");
        setDeliveryStreet("");
        setDeliveryCity("");
        setDeliveryState("");
        setDeliveryZip("");
        setPickupTime("");
        setDeliveryTime("");
        setOfferedAmount("");
        setPaymentNotes("");
        setSelectedMerchant(null);
        setUseCustomPickup(false);
        setShowDetails(false);
        setShowForm(false);
        
        await load();
        
        if (confirm("✅ Request posted! Click OK to view and chat with your territory owner.")) {
          router.push(`/request/${newRequest.id}`);
        }
      } else {
        alert("❌ Failed to post request. Please try again.");
      }
    } catch (e) {
      console.error("Submit failed:", e);
      alert("❌ Failed to post request. Please try again.");
    }
    setSubmitting(false);
  };

  const deleteRequest = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    
    try {
      await fetch("/.netlify/functions/requests-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      load();
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete request");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f0e8",
        fontFamily: "'DM Sans', sans-serif"
      }}>
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const displayRequests = isTerritoryOwner ? allRequests : myRequests;

  const getStatusInfo = (status: string) => {
    const info: Record<string, { label: string; color: string; bg: string }> = {
      open: { label: "🟢 Open", color: "#2d6a2d", bg: "#d4f0d4" },
      accepted: { label: "👤 Accepted", color: "#7a5c00", bg: "#fdf3cc" },
      completed: { label: "✅ Done", color: "#555", bg: "#e8e8e8" },
    };
    return info[status] || { label: status, color: "#555", bg: "#eee" };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f0e8;
          background-image:
            radial-gradient(circle at 70% 5%, rgba(255,200,120,0.12) 0%, transparent 45%),
            radial-gradient(circle at 20% 95%, rgba(134,193,134,0.1) 0%, transparent 45%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }
        .page { max-width: 640px; margin: 0 auto; padding: 28px 20px 80px; }
        .hero { text-align: center; margin-bottom: 32px; }
        .logo { font-family: 'Fraunces', serif; font-size: 2.2rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .tagline { font-size: 0.95rem; color: #888; margin-top: 6px; }

        .user-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: #fff; border-radius: 12px;
          margin-bottom: 20px; position: relative;
        }
        .user-info { font-size: 0.88rem; color: #666; }
        .user-menu-btn {
          background: #f5f0e8; border: 1.5px solid #e0d8cc;
          padding: 8px 12px; border-radius: 8px; cursor: pointer;
          font-size: 0.85rem; font-weight: 500; color: #2d4a2d;
          transition: all 0.2s;
        }
        .user-menu-btn:hover { background: #e8e0d4; }
        .user-dropdown {
          position: absolute; top: 100%; right: 16px; margin-top: 8px;
          background: #fff; border-radius: 12px;
          box-shadow: 0 4px 20px rgba(45,74,45,0.15);
          border: 1px solid #e0d8cc; min-width: 200px; z-index: 100;
        }
        .dropdown-item {
          padding: 12px 16px; border-bottom: 1px solid #f5f0e8;
          cursor: pointer; font-size: 0.88rem; color: #2d4a2d;
          transition: background 0.2s;
        }
        .dropdown-item:hover { background: #f5f0e8; }
        .dropdown-item:last-child { border-bottom: none; border-radius: 0 0 12px 12px; }
        .dropdown-item:first-child { border-radius: 12px 12px 0 0; }
        .dropdown-item.logout { color: #dc3545; }

        .card {
          background: #fff; border-radius: 16px; padding: 24px;
          margin-bottom: 24px; box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .card-title {
          font-family: 'Fraunces', serif; font-size: 1.2rem;
          color: #2d4a2d; margin-bottom: 16px; font-weight: 600;
        }
        .section-label {
          font-family: 'Fraunces', serif; font-size: 1rem;
          font-weight: 600; color: #2d4a2d; margin: 20px 0 12px;
          padding-top: 16px; border-top: 1px solid #e8e0d4;
        }
        .form-group { margin-bottom: 14px; }
        .label {
          display: block; font-size: 0.88rem; color: #555;
          font-weight: 500; margin-bottom: 6px;
        }
        .input, .select {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .input:focus, .select:focus { border-color: #7ab87a; background: #fff; }
        .input::placeholder { color: #bbb; }
        .textarea {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none;
          min-height: 80px; resize: vertical;
        }
        .textarea:focus { border-color: #7ab87a; background: #fff; }
        
        .radio-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .radio-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.88rem; color: #555; cursor: pointer;
        }
        
        .toggle-details {
          background: #f5f0e8; border: 1.5px dashed #e0d8cc;
          padding: 12px; border-radius: 10px; text-align: center;
          cursor: pointer; font-size: 0.88rem; color: #666;
          transition: all 0.2s; margin-bottom: 14px;
        }
        .toggle-details:hover { background: #e8e0d4; border-color: #7ab87a; }
        
        .btn {
          width: 100%; padding: 13px; border-radius: 12px;
          border: none; background: #2d4a2d; color: #f5f0e8;
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
          font-weight: 500; cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .btn:hover { background: #3d6b3d; }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .btn-outline {
          background: #fff; color: #2d4a2d; border: 1.5px solid #2d4a2d;
        }
        .btn-outline:hover { background: #2d4a2d; color: #f5f0e8; }
        
        .btn-danger {
          background: #dc3545; color: #fff; border: none; width: auto;
        }
        .btn-danger:hover { background: #c82333; }
        .btn-small { padding: 4px 8px; font-size: 0.75rem; }

        .alert {
          padding: 12px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 12px;
        }
        .alert-warning { background: #fff0e6; color: #c67700; }
        .alert-error { background: #ffe0e0; color: #c00; }

        .link-btn {
          background: none; border: none; color: #7ab87a;
          font-size: 0.85rem; cursor: pointer; text-decoration: underline;
          padding: 0; margin: 12px 0; display: block; text-align: center;
        }

        .req-list { display: flex; flex-direction: column; gap: 12px; }
        .req-item {
          background: #faf8f4; padding: 16px; border-radius: 12px;
          border: 1px solid #e8e0d4; transition: all 0.2s;
          cursor: pointer; position: relative;
        }
        .req-item:hover {
          background: #fff; box-shadow: 0 4px 12px rgba(45,74,45,0.08);
          transform: translateY(-2px);
        }
        .req-item.has-messages { border-left: 3px solid #7ab87a; }
        .req-top {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 6px; gap: 8px;
        }
        .req-title { font-weight: 600; font-size: 0.95rem; color: #2d4a2d; flex: 1; }
        .req-status {
          font-size: 0.75rem; padding: 3px 8px; border-radius: 100px;
          white-space: nowrap;
        }
        .req-route { font-size: 0.85rem; color: #888; margin-bottom: 6px; }
        .req-meta { font-size: 0.8rem; color: #999; margin-bottom: 8px; }
        
        .req-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 8px; border-top: 1px solid #e8e0d4;
        }
        .message-indicator {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.8rem; color: #7ab87a; font-weight: 500;
        }
        .message-badge {
          background: #7ab87a; color: #fff;
          width: 20px; height: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 600;
        }
        .card-actions { display: flex; gap: 8px; align-items: center; }
        .chat-btn {
          background: #2d4a2d; color: #f5f0e8;
          padding: 6px 12px; border-radius: 8px;
          font-size: 0.8rem; border: none;
          cursor: pointer; transition: all 0.2s;
        }
        .chat-btn:hover { background: #3d6b3d; }
        
        .empty { text-align: center; padding: 40px 20px; color: #bbb; font-size: 0.9rem; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
        .post-btn-wrapper { margin-bottom: 24px; }
        .tip-box {
          background: #f0f7f0; border: 1.5px solid #7ab87a;
          border-radius: 12px; padding: 14px; margin-bottom: 20px;
          font-size: 0.88rem; color: #2d4a2d; line-height: 1.5;
        }
        .tip-icon { font-size: 1.2rem; margin-right: 6px; }
      `}</style>

      <div className="page">
        <div className="hero">
          <div className="logo">errand<span>s</span></div>
          <div className="tagline">Your neighborhood helping hands</div>
        </div>

        <div className="user-header">
          <div className="user-info">
            👤 {user?.user_metadata?.full_name || user?.email}
          </div>
          <button className="user-menu-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
            Menu ▼
          </button>
          {showUserMenu && (
            <div className="user-dropdown">
              {isAdmin && (
                <div className="dropdown-item" onClick={() => router.push('/admin')}>
                  ⚙️ Admin Dashboard
                </div>
              )}
              {isTerritoryOwner && (
                <div className="dropdown-item" onClick={() => router.push('/owner')}>
                  📊 Owner Dashboard
                </div>
              )}
              <div className="dropdown-item" onClick={() => router.push('/directory')}>
                🏪 Merchants
              </div>
              <div className="dropdown-item logout" onClick={handleLogout}>
                🚪 Log Out
              </div>
            </div>
          )}
        </div>

        {!showForm ? (
          <div className="post-btn-wrapper">
            <button className="btn" onClick={() => setShowForm(true)}>
              + Post a Request
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="card-title">Post a Request</div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="label">What do you need?</label>
                <input className="input" placeholder="e.g. Pick up prescription from CVS"
                  value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="section-label">Delivery Address (Required First)</div>
              <div className="form-group">
                <label className="label">Street Address *</label>
                <input className="input" placeholder="456 Oak Ave"
                  value={deliveryStreet}
                  onChange={e => setDeliveryStreet(e.target.value)} required />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                <div className="form-group">
                  <label className="label">City *</label>
                  <input className="input" placeholder="Oconto"
                    value={deliveryCity}
                    onChange={e => setDeliveryCity(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">State *</label>
                  <select className="select" value={deliveryState}
                    onChange={e => setDeliveryState(e.target.value)} required>
                    <option value="">Select...</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="label">ZIP Code *</label>
                <input className="input" placeholder="54153" maxLength={5}
                  pattern="[0-9]{5}" value={deliveryZip}
                  onChange={e => setDeliveryZip(e.target.value.replace(/\D/g, '').slice(0,5))}
                  required />
              </div>

              <div className="section-label">Pickup Location</div>

              {deliveryZip.length !== 5 && (
                <div className="alert alert-warning">
                  Enter your delivery ZIP code first to see available merchants
                </div>
              )}

              {deliveryZip.length === 5 && !territory && (
                <div className="alert alert-error">
                  No service available in ZIP {deliveryZip} at this time
                </div>
              )}

              {deliveryZip.length === 5 && territory && availableMerchants.length === 0 && (
                <div className="alert alert-warning">
                  No merchants available for this territory yet. Use custom address below.
                </div>
              )}

              {availableMerchants.length > 0 && !useCustomPickup && (
                <>
                  <div className="form-group">
                    <label className="label">Select Merchant</label>
                    <select className="select" value={selectedMerchant || ""}
                      onChange={e => setSelectedMerchant(e.target.value ? parseInt(e.target.value) : null)}>
                      <option value="">Choose a merchant...</option>
                      {availableMerchants.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} - {m.address}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="link-btn"
                    onClick={() => setUseCustomPickup(true)}>
                    Or enter custom pickup address
                  </button>
                </>
              )}

              {(useCustomPickup || availableMerchants.length === 0) && (
                <>
                  {availableMerchants.length > 0 && (
                    <button type="button" className="link-btn"
                      onClick={() => {
                        setUseCustomPickup(false);
                        setPickupStreet("");
                        setPickupCity("");
                        setPickupState("");
                        setPickupZip("");
                      }}>
                      ← Back to merchant list
                    </button>
                  )}
                  <div className="form-group">
                    <label className="label">Street Address</label>
                    <input className="input" placeholder="123 Main St"
                      value={pickupStreet}
                      onChange={e => setPickupStreet(e.target.value)} />
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                    <div className="form-group">
                      <label className="label">City</label>
                      <input className="input" placeholder="Madison"
                        value={pickupCity}
                        onChange={e => setPickupCity(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="label">State</label>
                      <select className="select" value={pickupState}
                        onChange={e => setPickupState(e.target.value)}>
                        <option value="">Select...</option>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">ZIP Code</label>
                    <input className="input" placeholder="54153" maxLength={5}
                      value={pickupZip}
                      onChange={e => setPickupZip(e.target.value.replace(/\D/g, '').slice(0,5))} />
                  </div>
                </>
              )}

              <div className="toggle-details" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "▼" : "▶"} Add timing, cost & payment details
              </div>

              {showDetails && (
                <>
                  <div className="form-group">
                    <label className="label">Pickup timing</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input type="radio" name="pickupFlex" value="asap"
                          checked={pickupFlexibility === "asap"}
                          onChange={e => setPickupFlexibility(e.target.value)} />
                        ASAP
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="pickupFlex" value="flexible"
                          checked={pickupFlexibility === "flexible"}
                          onChange={e => setPickupFlexibility(e.target.value)} />
                        Flexible
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="pickupFlex" value="scheduled"
                          checked={pickupFlexibility === "scheduled"}
                          onChange={e => setPickupFlexibility(e.target.value)} />
                        Scheduled
                      </label>
                    </div>
                  </div>

                  {pickupFlexibility === "scheduled" && (
                    <div className="form-group">
                      <label className="label">Pickup time</label>
                      <input className="input" type="datetime-local"
                        value={pickupTime}
                        onChange={e => setPickupTime(e.target.value)} />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">Delivery timing</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input type="radio" name="deliveryFlex" value="asap"
                          checked={deliveryFlexibility === "asap"}
                          onChange={e => setDeliveryFlexibility(e.target.value)} />
                        ASAP
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="deliveryFlex" value="flexible"
                          checked={deliveryFlexibility === "flexible"}
                          onChange={e => setDeliveryFlexibility(e.target.value)} />
                        Flexible
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="deliveryFlex" value="scheduled"
                          checked={deliveryFlexibility === "scheduled"}
                          onChange={e => setDeliveryFlexibility(e.target.value)} />
                        By specific time
                      </label>
                    </div>
                  </div>

                  {deliveryFlexibility === "scheduled" && (
                    <div className="form-group">
                      <label className="label">Deliver by</label>
                      <input className="input" type="datetime-local"
                        value={deliveryTime}
                        onChange={e => setDeliveryTime(e.target.value)} />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">How much will you pay?</label>
                    <input className="input" type="number" step="0.01" placeholder="15.00"
                      value={offeredAmount}
                      onChange={e => setOfferedAmount(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="label">Payment method</label>
                    <select className="select" value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}>
                      <option>Cash</option>
                      <option>Venmo</option>
                      <option>Zelle</option>
                      <option>PayPal</option>
                      <option>CashApp</option>
                      <option>Apple Pay</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Payment notes (optional)</label>
                    <textarea className="textarea"
                      placeholder="e.g. Venmo @username, or any special instructions"
                      value={paymentNotes}
                      onChange={e => setPaymentNotes(e.target.value)} />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn" disabled={submitting} style={{flex: 1}}>
                  {submitting ? "Posting..." : "Post Request"}
                </button>
                <button type="button" className="btn btn-outline" 
                  onClick={() => setShowForm(false)} style={{flex: 1}}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isCustomer && myRequests.length > 0 && (
          <div className="tip-box">
            <span className="tip-icon">💬</span>
            <strong>Click any request to chat with your territory owner!</strong> They'll get notified and can answer questions or send updates.
          </div>
        )}

        <div className="card">
          <div className="card-title">
            {isCustomer ? "My Requests" : "All Requests"}
          </div>
          {displayRequests.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📦</div>
              {isCustomer ? "You haven't posted any requests yet." : "No requests yet."}
            </div>
          ) : (
            <div className="req-list">
              {displayRequests.slice(0, 20).map(r => {
                const statusInfo = getStatusInfo(r.status);
                const hasMessages = (r.message_count || 0) > 0;
                
                return (
                  <div key={r.id}
                    className={`req-item ${hasMessages ? 'has-messages' : ''}`}
                    onClick={() => router.push(`/request/${r.id}`)}>
                    <div className="req-top">
                      <div className="req-title">{r.title}</div>
                      <div className="req-status" 
                        style={{ background: statusInfo.bg, color: statusInfo.color }}>
                        {statusInfo.label}
                      </div>
                    </div>
                    <div className="req-route">
                      📍 {r.pickup} → 🏠 {r.dropoff}
                    </div>
                    <div className="req-meta">
                      {r.offered_amount && `$${r.offered_amount} • `}
                      {r.pickup_flexibility === 'asap' && 'ASAP • '}
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="req-footer">
                      <div className="message-indicator">
                        {hasMessages ? (
                          <>
                            <div className="message-badge">{r.message_count}</div>
                            <span>💬 {r.message_count} message{r.message_count !== 1 ? 's' : ''}</span>
                          </>
                        ) : (
                          <span style={{color: "#999"}}>No messages yet</span>
                        )}
                      </div>
                      <div className="card-actions">
                        <button className="chat-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/request/${r.id}`);
                          }}>
                          💬 Chat
                        </button>
                        {isAdmin && (
                          <button className="btn btn-danger btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRequest(r.id, r.title);
                            }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
