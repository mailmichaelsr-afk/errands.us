// app/page.tsx - With profile address auto-fill + notification bell + territory lookup + runner support

"use client";
import { useEffect, useState } from "react";import NotificationBell from "@/components/NotificationBell";
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
  const { user, dbUserId, userRole, isTerritoryOwner, isCustomer, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  
  const isRunner = userRole === 'runner' || userRole === 'independent_driver';

  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [requestFilter, setRequestFilter] = useState("all");

  // Saved profile address (loaded once)
  const [profileStreet, setProfileStreet] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [profileZip, setProfileZip] = useState("");
  const [profileDeliveryInstructions, setProfileDeliveryInstructions] = useState("");
  
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
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [usingProfileAddress, setUsingProfileAddress] = useState(true);
  const [pickupFlexibility, setPickupFlexibility] = useState("flexible");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryFlexibility, setDeliveryFlexibility] = useState("flexible");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [offeredAmount, setOfferedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [description, setDescription] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  
  // Merchant selection
  const [selectedMerchant, setSelectedMerchant] = useState<number | null>(null);
  const [availableMerchants, setAvailableMerchants] = useState<Merchant[]>([]);
  const [useCustomPickup, setUseCustomPickup] = useState(false);
  const [territory, setTerritory] = useState<any>(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load user's profile address
  useEffect(() => {
    if (!dbUserId) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/.netlify/functions/users-get?id=${dbUserId}`);
        if (res.ok) {
          const data = await res.json();
          const street = data.street || "";
          const city = data.city || "";
          const state = data.state || "";
          const zip = data.zip || "";
          const instructions = data.delivery_instructions || "";
          setProfileStreet(street);
          setProfileCity(city);
          setProfileState(state);
          setProfileZip(zip);
          setProfileDeliveryInstructions(instructions);
          setDeliveryStreet(street);
          setDeliveryCity(city);
          setDeliveryState(state);
          setDeliveryZip(zip);
          setDeliveryInstructions(instructions);
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    };
    fetchProfile();
  }, [dbUserId]);

  // Load territory when ZIP is known
  useEffect(() => {
    const zip = usingProfileAddress ? profileZip : deliveryZip;
    if (!zip || zip.length !== 5) {
      setTerritory(null);
      return;
    }
    const fetchTerritory = async () => {
      try {
        const res = await fetch(`/.netlify/functions/territories-get?zip=${zip}`);
        if (res.ok) {
          const data = await res.json();
          setTerritory(data.length > 0 ? data[0] : null);
        }
      } catch (e) {
        setTerritory(null);
      }
    };
    fetchTerritory();
  }, [deliveryZip, profileZip, usingProfileAddress]);

  // Load merchants
  useEffect(() => {
    const fetchAllMerchants = async () => {
      try {
        const res = await fetch("/.netlify/functions/merchants-get-all");
        if (res.ok) {
          const merchants = await res.json();
          const approved = merchants.filter((m: any) => m.status === 'approved');
          setAvailableMerchants(approved);
        }
      } catch (e) {
        console.error("Failed to load merchants:", e);
      }
    };
    fetchAllMerchants();
  }, []);

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

  const useProfileAddress = () => {
    setDeliveryStreet(profileStreet);
    setDeliveryCity(profileCity);
    setDeliveryState(profileState);
    setDeliveryZip(profileZip);
    setDeliveryInstructions(profileDeliveryInstructions);
    setUsingProfileAddress(true);
  };

  const load = async () => {
    try {
      const res = await fetch("/.netlify/functions/requests-get");
      if (res.ok) {
        const data = await res.json();
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
            } catch (e) {}
            return req;
          })
        );
        setAllRequests(requestsWithMessages);
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

  const acceptRequest = async (requestId: number) => {
    try {
      const res = await fetch("/.netlify/functions/requests-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, runner_id: dbUserId }),
      });
      if (res.ok) {
        alert("✅ Job accepted!");
        load();
        router.push('/runner');
      } else {
        alert("❌ Request already accepted by someone else");
      }
    } catch (e) {
      alert("Failed to accept request");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeZip = usingProfileAddress ? profileZip : deliveryZip;
    const activeStreet = usingProfileAddress ? profileStreet : deliveryStreet;
    const activeCity = usingProfileAddress ? profileCity : deliveryCity;
    const activeState = usingProfileAddress ? profileState : deliveryState;
    const activeInstructions = usingProfileAddress ? profileDeliveryInstructions : deliveryInstructions;

    if (!title || !activeZip) {
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
          description: description || null,
          customer_id: dbUserId,
          pickup_street: pickupStreet,
          pickup_city: pickupCity,
          pickup_state: pickupState,
          pickup_zip: pickupZip,
          delivery_street: activeStreet,
          delivery_city: activeCity,
          delivery_state: activeState,
          delivery_zip: activeZip,
          delivery_instructions: activeInstructions,
          pickup_time: pickupTime || null,
          pickup_flexibility: pickupFlexibility,
          delivery_time: deliveryTime || null,
          delivery_flexibility: deliveryFlexibility,
          offered_amount: offeredAmount ? parseFloat(offeredAmount) : null,
          payment_method: paymentMethod,
          payment_notes: paymentNotes || null,
          merchant_id: selectedMerchant || null,
        }),
      });

      if (res.ok) {
        const newRequest = await res.json();
        setTitle(""); setDescription("");
        setPickupStreet(""); setPickupCity(""); setPickupState(""); setPickupZip("");
        setDeliveryStreet(profileStreet); setDeliveryCity(profileCity);
        setDeliveryState(profileState); setDeliveryZip(profileZip);
        setDeliveryInstructions(profileDeliveryInstructions);
        setUsingProfileAddress(true);
        setPickupTime(""); setDeliveryTime(""); setOfferedAmount(""); setPaymentNotes("");
        setSelectedMerchant(null); setUseCustomPickup(false);
        setShowDetails(false); setShowForm(false);
        await load();
        if (confirm("✅ Request posted! Click OK to view and chat with your runner.")) {
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
      alert("Failed to delete request");
    }
  };

  const reorderRequest = (req: any) => {
    setTitle(req.title);
    setOfferedAmount(req.offered_amount?.toString() || "");
    setDeliveryStreet(req.delivery_street || "");
    setDeliveryCity(req.delivery_city || "");
    setDeliveryState(req.delivery_state || "");
    setDeliveryZip(req.delivery_zip || "");
    setDeliveryInstructions(req.delivery_instructions || "");
    setPickupStreet(req.pickup_street || "");
    setPickupCity(req.pickup_city || "");
    setPickupState(req.pickup_state || "");
    setPickupZip(req.pickup_zip || "");
    setUsingProfileAddress(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f5f0e8",
        fontFamily: "'DM Sans', sans-serif"
      }}>
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const displayRequests = isTerritoryOwner ? allRequests : myRequests;
  const filteredRequests = displayRequests.filter(r => {
    if (requestFilter === "all") return true;
    return r.status === requestFilter;
  });

  // Runners see all open requests
  const runnerRequests = allRequests.filter(r =>
    r.status === 'open' && (!r.assigned_to || r.assigned_to === dbUserId)
  );

  const getStatusInfo = (status: string) => {
    const info: Record<string, { label: string; color: string; bg: string }> = {
      open: { label: "🟢 Open", color: "#2d6a2d", bg: "#d4f0d4" },
      accepted: { label: "👤 Accepted", color: "#7a5c00", bg: "#fdf3cc" },
      completed: { label: "✅ Done", color: "#555", bg: "#e8e8e8" },
    };
    return info[status] || { label: status, color: "#555", bg: "#eee" };
  };

  const notifRole = isAdmin ? 'admin' : isTerritoryOwner ? 'owner' : isRunner ? 'runner' : 'customer';
  const hasProfileAddress = !!(profileStreet && profileZip);
  const activeZip = usingProfileAddress ? profileZip : deliveryZip;

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
        .user-header-right { display: flex; align-items: center; gap: 8px; }
        .user-menu-btn {
          background: #f5f0e8; border: 1.5px solid #e0d8cc;
          padding: 8px 12px; border-radius: 8px; cursor: pointer;
          font-size: 0.85rem; font-weight: 500; color: #2d4a2d; transition: all 0.2s;
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
          cursor: pointer; font-size: 0.88rem; color: #2d4a2d; transition: background 0.2s;
        }
        .dropdown-item:hover { background: #f5f0e8; }
        .dropdown-item:last-child { border-bottom: none; border-radius: 0 0 12px 12px; }
        .dropdown-item:first-child { border-radius: 12px 12px 0 0; }
        .dropdown-item.logout { color: #dc3545; }
        .runner-banner {
          background: #2d4a2d; color: #f5f0e8; border-radius: 12px;
          padding: 14px 18px; margin-bottom: 20px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .runner-banner-text { font-size: 0.9rem; font-weight: 500; }
        .runner-banner-btn {
          background: #7ab87a; color: #fff; border: none;
          padding: 8px 16px; border-radius: 8px; cursor: pointer;
          font-size: 0.85rem; font-weight: 600; font-family: 'DM Sans', sans-serif;
        }
        .card {
          background: #fff; border-radius: 16px; padding: 24px;
          margin-bottom: 24px; box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .card-title { font-family: 'Fraunces', serif; font-size: 1.2rem; color: #2d4a2d; margin-bottom: 16px; font-weight: 600; }
        .section-label {
          font-family: 'Fraunces', serif; font-size: 1rem;
          font-weight: 600; color: #2d4a2d; margin: 20px 0 12px;
          padding-top: 16px; border-top: 1px solid #e8e0d4;
        }
        .form-group { margin-bottom: 14px; }
        .label { display: block; font-size: 0.88rem; color: #555; font-weight: 500; margin-bottom: 6px; }
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
          width: 100%; padding: 12px 14px; border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #faf8f4; color: #1a1a1a; outline: none; min-height: 80px; resize: vertical;
        }
        .textarea:focus { border-color: #7ab87a; background: #fff; }
        .radio-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .radio-label { display: flex; align-items: center; gap: 6px; font-size: 0.88rem; color: #555; cursor: pointer; }
        .toggle-details {
          background: #f5f0e8; border: 1.5px dashed #e0d8cc;
          padding: 12px; border-radius: 10px; text-align: center;
          cursor: pointer; font-size: 0.88rem; color: #666;
          transition: all 0.2s; margin-bottom: 14px;
        }
        .toggle-details:hover { background: #e8e0d4; border-color: #7ab87a; }
        .btn {
          width: 100%; padding: 13px; border-radius: 12px; border: none;
          background: #2d4a2d; color: #f5f0e8; font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.2s, transform 0.1s;
        }
        .btn:hover { background: #3d6b3d; }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline { background: #fff; color: #2d4a2d; border: 1.5px solid #2d4a2d; }
        .btn-outline:hover { background: #2d4a2d; color: #f5f0e8; }
        .btn-danger { background: #dc3545; color: #fff; border: none; width: auto; }
        .btn-danger:hover { background: #c82333; }
        .btn-small { padding: 4px 8px; font-size: 0.75rem; }
        .btn-accept { background: #7ab87a; color: #fff; border: none; width: auto; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .btn-accept:hover { background: #5fa05f; }
        .alert { padding: 12px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 12px; }
        .alert-warning { background: #fff0e6; color: #c67700; }
        .alert-error { background: #ffe0e0; color: #c00; }
        .alert-info { background: #f0f7f0; color: #2d4a2d; border: 1px solid #c8e6c8; }
        .link-btn {
          background: none; border: none; color: #7ab87a;
          font-size: 0.85rem; cursor: pointer; text-decoration: underline;
          padding: 0; margin: 12px 0; display: block; text-align: center;
        }
        .address-toggle { display: flex; gap: 8px; margin-bottom: 16px; }
        .address-tab {
          flex: 1; padding: 10px; border-radius: 10px; border: 1.5px solid #e0d8cc;
          background: #faf8f4; color: #555; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; text-align: center; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .address-tab.active { background: #2d4a2d; color: #f5f0e8; border-color: #2d4a2d; }
        .req-list { display: flex; flex-direction: column; gap: 12px; }
        .req-item {
          background: #faf8f4; padding: 16px; border-radius: 12px;
          border: 1px solid #e8e0d4; transition: all 0.2s; cursor: pointer; position: relative;
        }
        .req-item:hover { background: #fff; box-shadow: 0 4px 12px rgba(45,74,45,0.08); transform: translateY(-2px); }
        .req-item.has-messages { border-left: 3px solid #7ab87a; }
        .req-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 8px; }
        .req-title { font-weight: 600; font-size: 0.95rem; color: #2d4a2d; flex: 1; }
        .req-status { font-size: 0.75rem; padding: 3px 8px; border-radius: 100px; white-space: nowrap; }
        .req-route { font-size: 0.85rem; color: #888; margin-bottom: 6px; }
        .req-meta { font-size: 0.8rem; color: #999; margin-bottom: 8px; }
        .req-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #e8e0d4; }
        .message-indicator { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #7ab87a; font-weight: 500; }
        .message-badge { background: #7ab87a; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 600; }
        .card-actions { display: flex; gap: 8px; align-items: center; }
        .chat-btn { background: #2d4a2d; color: #f5f0e8; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; border: none; cursor: pointer; transition: all 0.2s; }
        .chat-btn:hover { background: #3d6b3d; }
        .empty { text-align: center; padding: 40px 20px; color: #bbb; font-size: 0.9rem; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
        .post-btn-wrapper { margin-bottom: 24px; }
        .tip-box { background: #f0f7f0; border: 1.5px solid #7ab87a; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 0.88rem; color: #2d4a2d; line-height: 1.5; }
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
          <div className="user-header-right">
            {dbUserId && <NotificationBell userId={dbUserId} role={notifRole} />}
            <button className="user-menu-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
              Menu ▼
            </button>
          </div>
          {showUserMenu && (
            <div className="user-dropdown">
              {isAdmin && <div className="dropdown-item" onClick={() => router.push('/admin')}>⚙️ Admin Dashboard</div>}
              {isTerritoryOwner && <div className="dropdown-item" onClick={() => router.push('/owner')}>📊 Owner Dashboard</div>}
              {isRunner && <div className="dropdown-item" onClick={() => router.push('/runner')}>🏃 Runner Dashboard</div>}
              <div className="dropdown-item" onClick={() => router.push('/profile')}>👤 Profile & Settings</div>
              <div className="dropdown-item" onClick={() => router.push('/directory')}>🏪 Merchants</div>
              <div className="dropdown-item logout" onClick={handleLogout}>🚪 Log Out</div>
            </div>
          )}
        </div>

        {/* Runner banner — show available jobs count and quick link */}
        {isRunner && runnerRequests.length > 0 && (
          <div className="runner-banner">
            <div className="runner-banner-text">
              📦 {runnerRequests.length} job{runnerRequests.length !== 1 ? 's' : ''} available in your area
            </div>
            <button className="runner-banner-btn" onClick={() => router.push('/runner')}>
              View Jobs →
            </button>
          </div>
        )}

        {!showForm ? (
          <div className="post-btn-wrapper">
            <button className="btn" onClick={() => setShowForm(true)}>+ Post a Request</button>
          </div>
        ) : (
          <div className="card">
            <div className="card-title">Post a Request</div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="label">What do you need? *</label>
                <input className="input" placeholder="e.g. Pick up prescription from Walgreens"
                  value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="label">More details (optional)</label>
                <textarea className="textarea" placeholder="Any extra info the runner should know — specific items, quantities, brand preferences, special instructions, etc."
                  value={description} onChange={e => setDescription(e.target.value)}
                  style={{minHeight: '70px'}} />
              </div>

              <div className="section-label">Delivery Address</div>

              {hasProfileAddress && (
                <div className="address-toggle">
                  <button type="button" className={`address-tab ${usingProfileAddress ? 'active' : ''}`} onClick={useProfileAddress}>
                    🏠 My Home Address
                  </button>
                  <button type="button" className={`address-tab ${!usingProfileAddress ? 'active' : ''}`} onClick={() => setUsingProfileAddress(false)}>
                    📍 Different Address
                  </button>
                </div>
              )}

              {hasProfileAddress && usingProfileAddress ? (
                <div className="alert alert-info" style={{marginBottom: '14px'}}>
                  <strong>Delivering to:</strong> {profileStreet}, {profileCity}, {profileState} {profileZip}
                  {profileDeliveryInstructions && (
                    <div style={{marginTop: '4px', fontSize: '0.82rem', color: '#555'}}>
                      📝 {profileDeliveryInstructions}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="label">Street Address *</label>
                    <input className="input" placeholder="456 Oak Ave"
                      value={deliveryStreet} onChange={e => setDeliveryStreet(e.target.value)} required />
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                    <div className="form-group">
                      <label className="label">City *</label>
                      <input className="input" placeholder="Oconto"
                        value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="label">State *</label>
                      <select className="select" value={deliveryState} onChange={e => setDeliveryState(e.target.value)} required>
                        <option value="">Select...</option>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">ZIP Code *</label>
                    <input className="input" placeholder="54153" maxLength={5} pattern="[0-9]{5}"
                      value={deliveryZip} onChange={e => setDeliveryZip(e.target.value.replace(/\D/g, '').slice(0,5))} required />
                  </div>
                  <div className="form-group">
                    <label className="label">Delivery Instructions (optional)</label>
                    <input className="input" placeholder="Gate code, back door, etc."
                      value={deliveryInstructions} onChange={e => setDeliveryInstructions(e.target.value)} />
                  </div>
                </>
              )}

              {!hasProfileAddress && (
                <div className="alert alert-warning" style={{marginBottom: '14px'}}>
                  💡 Save your address in <button type="button" className="link-btn" style={{display:'inline', margin: 0}} onClick={() => router.push('/profile')}>Profile Settings</button> to auto-fill next time.
                </div>
              )}

              <div className="section-label">Pickup Location <span style={{fontFamily:'DM Sans,sans-serif', fontWeight:400, fontSize:'0.8rem', color:'#999'}}>(optional)</span></div>

              {activeZip.length === 5 && !territory && (
                <div className="alert alert-error">
                  No service available in ZIP {activeZip} at this time
                </div>
              )}
              {activeZip.length < 5 && !usingProfileAddress && (
                <div className="alert alert-warning">
                  Enter your delivery ZIP code first to see available merchants
                </div>
              )}

              {availableMerchants.length > 0 && !useCustomPickup && (
                <>
                  <div className="form-group">
                    <label className="label">Select Merchant (optional)</label>
                    <select className="select" value={selectedMerchant || ""}
                      onChange={e => setSelectedMerchant(e.target.value ? parseInt(e.target.value) : null)}>
                      <option value="">No merchant / describe in notes above</option>
                      {availableMerchants.map(m => (
                        <option key={m.id} value={m.id}>{m.name} - {m.address}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="link-btn" onClick={() => setUseCustomPickup(true)}>
                    Or enter a custom pickup address
                  </button>
                </>
              )}

              {(useCustomPickup || availableMerchants.length === 0) && (
                <>
                  {availableMerchants.length > 0 && (
                    <button type="button" className="link-btn"
                      onClick={() => { setUseCustomPickup(false); setPickupStreet(""); setPickupCity(""); setPickupState(""); setPickupZip(""); }}>
                      ← Back to merchant list
                    </button>
                  )}
                  <div className="form-group">
                    <label className="label">Street Address</label>
                    <input className="input" placeholder="123 Main St" value={pickupStreet} onChange={e => setPickupStreet(e.target.value)} />
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                    <div className="form-group">
                      <label className="label">City</label>
                      <input className="input" placeholder="Madison" value={pickupCity} onChange={e => setPickupCity(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="label">State</label>
                      <select className="select" value={pickupState} onChange={e => setPickupState(e.target.value)}>
                        <option value="">Select...</option>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">ZIP Code</label>
                    <input className="input" placeholder="54153" maxLength={5}
                      value={pickupZip} onChange={e => setPickupZip(e.target.value.replace(/\D/g, '').slice(0,5))} />
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
                      {['asap','flexible','scheduled'].map(v => (
                        <label key={v} className="radio-label">
                          <input type="radio" name="pickupFlex" value={v}
                            checked={pickupFlexibility === v} onChange={e => setPickupFlexibility(e.target.value)} />
                          {v === 'asap' ? 'ASAP' : v === 'flexible' ? 'Flexible' : 'Scheduled'}
                        </label>
                      ))}
                    </div>
                  </div>
                  {pickupFlexibility === "scheduled" && (
                    <div className="form-group">
                      <label className="label">Pickup time</label>
                      <input className="input" type="datetime-local" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="label">Delivery timing</label>
                    <div className="radio-group">
                      {[['asap','ASAP'],['flexible','Flexible'],['scheduled','By specific time']].map(([v,l]) => (
                        <label key={v} className="radio-label">
                          <input type="radio" name="deliveryFlex" value={v}
                            checked={deliveryFlexibility === v} onChange={e => setDeliveryFlexibility(e.target.value)} />
                          {l}
                        </label>
                      ))}
                    </div>
                  </div>
                  {deliveryFlexibility === "scheduled" && (
                    <div className="form-group">
                      <label className="label">Deliver by</label>
                      <input className="input" type="datetime-local" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="label">How much will you pay?</label>
                    <input className="input" type="number" step="0.01" placeholder="15.00"
                      value={offeredAmount} onChange={e => setOfferedAmount(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Payment method</label>
                    <select className="select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                      <option>Cash</option><option>Venmo</option><option>Zelle</option>
                      <option>PayPal</option><option>CashApp</option><option>Apple Pay</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Payment notes (optional)</label>
                    <textarea className="textarea" placeholder="e.g. Venmo @username"
                      value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn" disabled={submitting} style={{flex: 1}}>
                  {submitting ? "Posting..." : "Post Request"}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} style={{flex: 1}}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isCustomer && myRequests.length > 0 && (
          <div className="tip-box">
            <span className="tip-icon">💬</span>
            <strong>Click any request to chat with your runner!</strong> They'll get notified and can answer questions or send updates.
          </div>
        )}

        <div className="card">
          <div className="card-title">{isCustomer ? "My Requests" : isRunner ? "Available Jobs" : "All Requests"}</div>
          {isCustomer && (
            <div style={{display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap'}}>
              {[
                { key: "all", label: `All (${displayRequests.length})` },
                { key: "open", label: `Open (${displayRequests.filter(r => r.status === 'open').length})` },
                { key: "accepted", label: `In Progress (${displayRequests.filter(r => r.status === 'accepted').length})` },
                { key: "completed", label: `Completed (${displayRequests.filter(r => r.status === 'completed').length})` },
              ].map(f => (
                <button key={f.key} onClick={() => setRequestFilter(f.key)} style={{
                  padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #e0d8cc',
                  background: requestFilter === f.key ? '#2d4a2d' : '#faf8f4',
                  color: requestFilter === f.key ? '#f5f0e8' : '#555',
                  fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer'
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Runner view — show available jobs with accept button */}
          {isRunner ? (
            runnerRequests.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📦</div>
                No available jobs right now. Check back soon!
              </div>
            ) : (
              <div className="req-list">
                {runnerRequests.map(r => {
                  const statusInfo = getStatusInfo(r.status);
                  return (
                    <div key={r.id} className="req-item" onClick={() => router.push(`/request/${r.id}`)}>
                      <div className="req-top">
                        <div className="req-title">{r.title}</div>
                        <div className="req-status" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                          {statusInfo.label}
                        </div>
                      </div>
                      <div className="req-route">📍 {r.pickup} → 🏠 {r.dropoff}</div>
                      <div className="req-meta">
                        {r.offered_amount && `💰 $${r.offered_amount} • `}
                        {r.pickup_flexibility === 'asap' && 'ASAP • '}
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                      <div className="req-footer">
                        <button className="chat-btn" onClick={(e) => { e.stopPropagation(); router.push(`/request/${r.id}`); }}>
                          💬 Details
                        </button>
                        <button className="btn-accept" onClick={(e) => { e.stopPropagation(); acceptRequest(r.id); }}>
                          ✅ Accept Job
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            filteredRequests.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📦</div>
                {isCustomer ? "You haven't posted any requests yet." : "No requests yet."}
              </div>
            ) : (
              <div className="req-list">
                {filteredRequests.slice(0, 20).map(r => {
                  const statusInfo = getStatusInfo(r.status);
                  const hasMessages = (r.message_count || 0) > 0;
                  return (
                    <div key={r.id} className={`req-item ${hasMessages ? 'has-messages' : ''}`}
                      onClick={() => router.push(`/request/${r.id}`)}>
                      <div className="req-top">
                        <div className="req-title">{r.title}</div>
                        <div className="req-status" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                          {statusInfo.label}
                        </div>
                      </div>
                      <div className="req-route">📍 {r.pickup} → 🏠 {r.dropoff}</div>
                      <div className="req-meta">
                        {r.offered_amount && `$${r.offered_amount} • `}
                        {r.pickup_flexibility === 'asap' && 'ASAP • '}
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                      <div className="req-footer">
                        <div className="message-indicator">
                          {hasMessages ? (
                            <><div className="message-badge">{r.message_count}</div>
                            <span>💬 {r.message_count} message{r.message_count !== 1 ? 's' : ''}</span></>
                          ) : <span style={{color: "#999"}}>No messages yet</span>}
                        </div>
                        <div className="card-actions">
                          <button className="chat-btn" onClick={(e) => { e.stopPropagation(); router.push(`/request/${r.id}`); }}>
                            💬 Chat
                          </button>
                          {isCustomer && r.status === 'open' && (
                            <button className="chat-btn"
                              style={{background: '#f5f0e8', color: '#2d4a2d', border: '1.5px solid #e0d8cc'}}
                              onClick={async (e) => {
                                e.stopPropagation();
                                const newAmount = prompt(`Current offer: $${r.offered_amount || 0}\nEnter new amount:`);
                                if (!newAmount || isNaN(parseFloat(newAmount))) return;
                                await fetch('/.netlify/functions/requests-update-offer', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    request_id: r.id,
                                    customer_id: dbUserId,
                                    offered_amount: parseFloat(newAmount)
                                  })
                                });
                                load();
                              }}>
                              💰 Update Offer
                            </button>
                          )}
                          {isCustomer && r.status === 'completed' && (
                            <button className="chat-btn" onClick={(e) => { e.stopPropagation(); reorderRequest(r); }}
                              style={{background: '#7ab87a', color: '#fff'}}>
                              🔄 Order Again
                            </button>
                          )}
                          {isAdmin && (
                            <button className="btn btn-danger btn-small"
                              onClick={(e) => { e.stopPropagation(); deleteRequest(r.id, r.title); }}>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
