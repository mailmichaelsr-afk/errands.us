// app/owner/merchants/page.tsx - Territory owner manages their merchant list

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Merchant = {
  id: number;
  name: string;
  category: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  link_id?: number;
};

type Territory = {
  id: number;
  name: string;
};

export default function OwnerMerchants() {
  const { user, dbUserId, isTerritoryOwner, loading } = useAuth();
  const router = useRouter();
  
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [myMerchants, setMyMerchants] = useState<Merchant[]>([]);
  const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isTerritoryOwner) {
      router.replace("/owner");
    }
  }, [loading, isTerritoryOwner, router]);

  const loadData = async () => {
    if (!dbUserId) return;
    
    setLoadingData(true);
    try {
      // Get territory
      const terrRes = await fetch(`/.netlify/functions/territory-get-by-owner?user_id=${dbUserId}`);
      if (terrRes.ok) {
        const terrData = await terrRes.json();
        setTerritory(terrData);
        
        // Get merchants for this territory
        const myMerchRes = await fetch(`/.netlify/functions/territory-merchants-get?territory_id=${terrData.id}`);
        if (myMerchRes.ok) {
          setMyMerchants(await myMerchRes.json());
        }
      }
      
      // Get all approved merchants
      const allMerchRes = await fetch("/.netlify/functions/merchants-get-all");
      if (allMerchRes.ok) {
        const all = await allMerchRes.json();
        setAllMerchants(all.filter((m: Merchant) => m.status === 'approved'));
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (dbUserId) loadData();
  }, [dbUserId]);

  const addMerchant = async (merchantId: number) => {
    if (!territory) return;
    
    await fetch("/.netlify/functions/territory-merchants-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        territory_id: territory.id,
        merchant_id: merchantId,
        user_id: dbUserId,
      }),
    });
    
    loadData();
  };

  const removeMerchant = async (merchantId: number) => {
    if (!territory || !confirm("Remove this merchant from your list?")) return;
    
    await fetch("/.netlify/functions/territory-merchants-remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        territory_id: territory.id,
        merchant_id: merchantId,
      }),
    });
    
    loadData();
  };

  if (loading || loadingData) {
    return <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>;
  }

  if (!isTerritoryOwner || !territory) return null;

  const myMerchantIds = myMerchants.map(m => m.id);
  const availableMerchants = allMerchants
    .filter(m => !myMerchantIds.includes(m.id))
    .filter(m => !searchQuery || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 1000px; margin: 0 auto; padding: 32px 20px; }
        
        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #2d4a2d; text-decoration: none; font-size: 0.88rem;
          font-weight: 500; margin-bottom: 20px; opacity: 0.65;
        }
        .back:hover { opacity: 1; }
        .title { font-family: 'Fraunces', serif; font-size: 1.8rem; color: #2d4a2d; font-weight: 700; margin-bottom: 8px; }
        .subtitle { color: #888; font-size: 0.9rem; margin-bottom: 32px; }
        
        .section-head {
          font-family: 'Fraunces', serif; font-size: 1.2rem;
          color: #2d4a2d; margin: 28px 0 14px; font-weight: 600;
        }
        
        .search-box {
          margin-bottom: 20px;
        }
        .input {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid #e0d8cc; border-radius: 11px;
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          background: #fff; outline: none;
        }
        .input:focus { border-color: #7ab87a; }
        
        .card {
          background: #fff; border-radius: 14px; padding: 20px;
          margin-bottom: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-info { flex: 1; }
        .card-title { font-weight: 600; font-size: 1rem; color: #1a1a1a; margin-bottom: 4px; }
        .card-meta { font-size: 0.85rem; color: #999; }
        .badge { 
          display: inline-block; padding: 3px 8px; border-radius: 100px;
          font-size: 0.7rem; font-weight: 500; background: #e6f0ff; color: #0056b3;
          margin-left: 8px;
        }
        
        .btn {
          padding: 8px 16px; border-radius: 10px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .btn-primary { background: #2d4a2d; color: #f5f0e8; }
        .btn-primary:hover { background: #3d6b3d; }
        .btn-danger { background: #dc3545; color: #fff; }
        .btn-danger:hover { background: #c82333; }
        
        .empty { text-align: center; padding: 40px; color: #bbb; font-size: 0.9rem; }
      `}</style>

      <div className="page">
        <a href="/owner" className="back">← Back to Dashboard</a>

        <div className="title">Manage Merchants</div>
        <div className="subtitle">
          Add merchants you're willing to pick up from. Customers in your territory will only see these merchants.
        </div>

        <div className="section-head">Your Merchants ({myMerchants.length})</div>
        {myMerchants.length === 0 ? (
          <div className="empty">
            No merchants added yet. Search below to add merchants you'll pick up from.
          </div>
        ) : (
          myMerchants.map(m => (
            <div key={m.id} className="card">
              <div className="card-info">
                <div className="card-title">
                  {m.name}
                  <span className="badge">{m.category}</span>
                </div>
                <div className="card-meta">{m.address}</div>
              </div>
              <button className="btn btn-danger" onClick={() => removeMerchant(m.id)}>
                Remove
              </button>
            </div>
          ))
        )}

        <div className="section-head">Add Merchants</div>
        <div className="search-box">
          <input
            className="input"
            placeholder="Search merchants by name or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {availableMerchants.length === 0 ? (
          <div className="empty">
            {searchQuery ? "No merchants found matching your search" : "All merchants have been added"}
          </div>
        ) : (
          availableMerchants.map(m => (
            <div key={m.id} className="card">
              <div className="card-info">
                <div className="card-title">
                  {m.name}
                  <span className="badge">{m.category}</span>
                </div>
                <div className="card-meta">{m.address}</div>
              </div>
              <button className="btn btn-primary" onClick={() => addMerchant(m.id)}>
                Add
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
