// app/orders/page.tsx - Customer order history with reorder

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Request = {
  id: number;
  title: string;
  pickup_street?: string;
  pickup_city?: string;
  delivery_street?: string;
  delivery_city?: string;
  status: string;
  offered_amount?: number;
  created_at: string;
  completed_at?: string;
  rating?: number;
  merchant_id?: number;
  merchant_name?: string;
};

export default function OrderHistory() {
  const { user, dbUserId, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState("all");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (dbUserId) loadOrders();
  }, [dbUserId]);

  const loadOrders = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/.netlify/functions/requests-get?customer_id=${dbUserId}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    }
    setLoadingData(false);
  };

  const reorder = (req: Request) => {
    // Redirect to home with pre-filled data
    const params = new URLSearchParams({
      title: req.title,
      merchant_id: req.merchant_id?.toString() || '',
      pickup_street: req.pickup_street || '',
      pickup_city: req.pickup_city || '',
      delivery_street: req.delivery_street || '',
      delivery_city: req.delivery_city || '',
      amount: req.offered_amount?.toString() || '',
    });
    router.push(`/?reorder=true&${params.toString()}`);
  };

  const filteredRequests = requests.filter(r => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const statusBadge = (status: string) => {
    const badges: Record<string, string> = {
      open: "🟡 Open",
      accepted: "🔵 In Progress", 
      completed: "✅ Completed",
      cancelled: "❌ Cancelled",
    };
    return badges[status] || status;
  };

  if (loading || loadingData) {
    return <div style={{padding: '40px', textAlign: 'center', color: '#999'}}>Loading...</div>;
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
        .page { max-width: 900px; margin: 0 auto; }
        .back {
          display: inline-block;
          color: #7ab87a;
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 20px;
        }
        .back:hover { text-decoration: underline; }
        .header {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.1);
        }
        .title {
          font-family: 'Fraunces', serif;
          font-size: 1.8rem;
          color: #2d4a2d;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1.5px solid #e0d8cc;
          background: #faf8f4;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-btn:hover { border-color: #7ab87a; }
        .filter-btn.active {
          background: #2d4a2d;
          color: #f5f0e8;
          border-color: #2d4a2d;
        }
        .order-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .order-title {
          font-weight: 600;
          font-size: 1rem;
          color: #1a1a1a;
        }
        .order-date {
          font-size: 0.8rem;
          color: #999;
        }
        .order-details {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 12px;
          line-height: 1.6;
        }
        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          background: #f0f0f0;
        }
        .amount {
          font-weight: 600;
          color: #2d4a2d;
          font-size: 1.1rem;
        }
        .btn-reorder {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid #7ab87a;
          background: #fff;
          color: #2d4a2d;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-reorder:hover {
          background: #7ab87a;
          color: #fff;
        }
        .empty {
          text-align: center;
          padding: 60px 20px;
          color: #bbb;
        }
        .empty-icon { font-size: 3rem; margin-bottom: 16px; }
        .rating {
          color: #ffc107;
          font-size: 0.85rem;
        }
      `}</style>

      <div className="page">
        <a href="/" className="back">← Back to Home</a>

        <div className="header">
          <div className="title">Order History</div>
          <div className="filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({requests.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
              onClick={() => setFilter('open')}
            >
              Open ({requests.filter(r => r.status === 'open').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'accepted' ? 'active' : ''}`}
              onClick={() => setFilter('accepted')}
            >
              In Progress ({requests.filter(r => r.status === 'accepted').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({requests.filter(r => r.status === 'completed').length})
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <div>No orders found</div>
          </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-title">{req.title}</div>
                  <div className="order-date">
                    {new Date(req.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <span className="badge">{statusBadge(req.status)}</span>
              </div>

              <div className="order-details">
                {req.merchant_name && <div>📍 {req.merchant_name}</div>}
                <div>
                  🏠 Deliver to: {req.delivery_street}, {req.delivery_city}
                </div>
                {req.rating && (
                  <div className="rating">
                    ⭐ {req.rating}/5
                  </div>
                )}
              </div>

              <div className="order-footer">
                <div className="amount">
                  ${req.offered_amount?.toFixed(2) || '0.00'}
                </div>
                {req.status === 'completed' && (
                  <button className="btn-reorder" onClick={() => reorder(req)}>
                    🔄 Order Again
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
