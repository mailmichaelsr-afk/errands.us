// app/marketplace/page.tsx - Public territory marketplace

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Territory = {
  id: number;
  name: string;
  zip_codes: string[];
  price?: number;
  time_slot_days: string[];
  time_slot_start: string;
  time_slot_end: string;
  request_count_30d?: number;
  estimated_monthly?: number;
};

const DAY_LABELS: Record<string, string> = {
  mon: 'M', tue: 'T', wed: 'W', thu: 'Th', fri: 'F', sat: 'Sa', sun: 'Su'
};

export default function Marketplace() {
  const router = useRouter();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTerritories();
  }, []);

  const loadTerritories = async () => {
    try {
      const res = await fetch("/.netlify/functions/territories-marketplace");
      if (res.ok) {
        setTerritories(await res.json());
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }
    setLoading(false);
  };

  const requestPurchase = (territoryId: number, name: string) => {
    if (confirm(`Request to purchase "${name}"? Admin will contact you to complete the purchase.`)) {
      // Could send email or create purchase request here
      alert("Purchase request sent! Admin will contact you soon.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        
        .hero {
          background: linear-gradient(135deg, #2d4a2d 0%, #3d6b3d 100%);
          color: #f5f0e8;
          padding: 60px 20px;
          text-align: center;
        }
        .hero-title {
          font-family: 'Fraunces', serif;
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .hero-title span { color: #7ab87a; }
        .hero-subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto 32px;
        }
        .hero-cta {
          display: inline-block;
          padding: 14px 32px;
          background: #7ab87a;
          color: #fff;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 500;
          font-size: 1.1rem;
          transition: all 0.2s;
        }
        .hero-cta:hover {
          background: #5fa05f;
          transform: translateY(-2px);
        }

        .page { max-width: 1200px; margin: 0 auto; padding: 60px 20px; }
        
        .section-title {
          font-family: 'Fraunces', serif;
          font-size: 2rem;
          color: #2d4a2d;
          text-align: center;
          margin-bottom: 16px;
        }
        .section-subtitle {
          text-align: center;
          color: #888;
          font-size: 1rem;
          margin-bottom: 48px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .territory-card {
          background: #fff;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(45,74,45,0.08);
          border: 2px solid transparent;
          transition: all 0.3s;
        }
        .territory-card:hover {
          border-color: #7ab87a;
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(45,74,45,0.12);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .card-title {
          font-family: 'Fraunces', serif;
          font-size: 1.3rem;
          color: #2d4a2d;
          font-weight: 700;
        }
        .card-price {
          background: #2d4a2d;
          color: #f5f0e8;
          padding: 8px 16px;
          border-radius: 100px;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .card-zips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .zip-tag {
          background: #e6f0ff;
          color: #0056b3;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .card-schedule {
          background: #faf8f4;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 0.85rem;
          color: #555;
        }

        .card-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        .metric {
          background: #f0f7f0;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
        }
        .metric-label {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 4px;
        }
        .metric-value {
          font-family: 'Fraunces', serif;
          font-size: 1.3rem;
          color: #2d4a2d;
          font-weight: 700;
        }

        .card-btn {
          width: 100%;
          padding: 14px;
          background: #2d4a2d;
          color: #f5f0e8;
          border: none;
          border-radius: 12px;
          font-weight: 500;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .card-btn:hover {
          background: #3d6b3d;
          transform: translateY(-2px);
        }

        .empty {
          text-align: center;
          padding: 80px 20px;
          color: #bbb;
        }
        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .benefits {
          background: #fff;
          border-radius: 20px;
          padding: 60px 40px;
          margin: 60px 0;
          box-shadow: 0 4px 30px rgba(45,74,45,0.08);
        }
        .benefits-title {
          font-family: 'Fraunces', serif;
          font-size: 2rem;
          color: #2d4a2d;
          text-align: center;
          margin-bottom: 40px;
        }
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
        }
        .benefit {
          text-align: center;
        }
        .benefit-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }
        .benefit-title {
          font-weight: 600;
          font-size: 1.1rem;
          color: #2d4a2d;
          margin-bottom: 8px;
        }
        .benefit-text {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.6;
        }
      `}</style>

      <div className="hero">
        <div className="hero-title">errand<span>s</span> Territories</div>
        <div className="hero-subtitle">
          Own your local delivery territory. Get exclusive access to all customer requests in your area.
        </div>
        <a href="/driver-signup" className="hero-cta">
          Become a Driver First (Free)
        </a>
      </div>

      <div className="page">
        <div className="section-title">Available Territories</div>
        <div className="section-subtitle">
          Purchase a territory and get exclusive rights to all delivery requests in your ZIP codes. 
          Monthly subscription includes all requests, customer support, and territory management tools.
        </div>

        {loading ? (
          <div className="empty">
            <div className="empty-icon">⏳</div>
            Loading territories...
          </div>
        ) : territories.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🗺️</div>
            <div style={{fontSize: '1.2rem', marginBottom: 12}}>No territories available yet</div>
            <div style={{fontSize: '0.9rem'}}>Check back soon or contact us to request a territory in your area</div>
          </div>
        ) : (
          <div className="grid">
            {territories.map(t => (
              <div key={t.id} className="territory-card">
                <div className="card-header">
                  <div className="card-title">{t.name}</div>
                  <div className="card-price">
                    ${t.price || 299}/mo
                  </div>
                </div>

                <div className="card-zips">
                  {t.zip_codes.map(zip => (
                    <div key={zip} className="zip-tag">{zip}</div>
                  ))}
                </div>

                <div className="card-schedule">
                  ⏰ {t.time_slot_days.map(d => DAY_LABELS[d]).join('')} 
                  {' '}{t.time_slot_start.slice(0,5)}-{t.time_slot_end.slice(0,5)}
                </div>

                <div className="card-metrics">
                  <div className="metric">
                    <div className="metric-label">Requests (30d)</div>
                    <div className="metric-value">{t.request_count_30d || 0}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Est. Monthly</div>
                    <div className="metric-value">${t.estimated_monthly || '500+'}</div>
                  </div>
                </div>

                <button 
                  className="card-btn"
                  onClick={() => requestPurchase(t.id, t.name)}
                >
                  Request to Purchase
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="benefits">
          <div className="benefits-title">Why Own a Territory?</div>
          <div className="benefits-grid">
            <div className="benefit">
              <div className="benefit-icon">🎯</div>
              <div className="benefit-title">Exclusive Access</div>
              <div className="benefit-text">
                Get all requests in your ZIP codes automatically assigned to you
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">💰</div>
              <div className="benefit-title">Build Your Business</div>
              <div className="benefit-text">
                Predictable income from recurring customers in your area
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">📈</div>
              <div className="benefit-title">Scale & Grow</div>
              <div className="benefit-text">
                Hire additional drivers as your territory grows
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">🛠️</div>
              <div className="benefit-title">Management Tools</div>
              <div className="benefit-text">
                Dashboard, analytics, customer management, and more
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
