// app/owner/analytics/page.tsx
// Performance analytics for territory owners

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Analytics = {
  totalEarnings: number;
  completedRequests: number;
  averageEarnings: number;
  topHours: Array<{ hour: number; count: number; earnings: number }>;
  last7Days: Array<{ date: string; earnings: number; requests: number }>;
  customerRetention: number;
  averageRating: number;
};

export default function OwnerAnalytics() {
  const { user, isTerritoryOwner, dbUserId, loading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (!loading && (!user || !isTerritoryOwner)) {
      router.replace("/login");
    }
  }, [user, isTerritoryOwner, loading]);

  const loadAnalytics = async () => {
    if (!dbUserId) return;
    
    try {
      const res = await fetch(`/.netlify/functions/analytics-get?owner_id=${dbUserId}&range=${timeRange}`);
      if (res.ok) setAnalytics(await res.json());
    } catch (e) {
      console.error("Failed to load analytics:", e);
    }
  };

  useEffect(() => {
    if (isTerritoryOwner && dbUserId) loadAnalytics();
  }, [isTerritoryOwner, dbUserId, timeRange]);

  if (loading || !isTerritoryOwner || !analytics) return null;

  const peakHour = analytics.topHours[0];
  const bestDay = analytics.last7Days.reduce((best, day) => 
    day.earnings > best.earnings ? day : best
  , analytics.last7Days[0]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 900px; margin: 0 auto; padding: 28px 16px; }
        
        .header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
        }
        .title { font-family: 'Fraunces', serif; font-size: 1.6rem; font-weight: 700; color: #2d4a2d; }
        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #2d4a2d; text-decoration: none; font-size: 0.88rem;
          font-weight: 500; opacity: 0.65; transition: opacity 0.15s;
        }
        .back:hover { opacity: 1; }

        .range-tabs {
          display: flex; gap: 6px; background: #fff; padding: 4px;
          border-radius: 10px; margin-bottom: 20px;
        }
        .range-tab {
          padding: 8px 16px; border-radius: 8px; border: none;
          background: transparent; font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 500; color: #666;
          cursor: pointer; transition: all 0.2s;
        }
        .range-tab.active { background: #2d4a2d; color: #f5f0e8; }

        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px; margin-bottom: 24px;
        }
        .stat-card {
          background: #fff; padding: 18px; border-radius: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .stat-label { font-size: 0.78rem; color: #999; margin-bottom: 6px; }
        .stat-value { font-family: 'Fraunces', serif; font-size: 1.8rem; color: #2d4a2d; font-weight: 700; }
        .stat-subtext { font-size: 0.75rem; color: #7ab87a; margin-top: 4px; }

        .card {
          background: #fff; border-radius: 14px; padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(45,74,45,0.07);
          border: 1px solid rgba(45,74,45,0.05);
        }
        .card-title { font-weight: 600; font-size: 1.05rem; color: #2d4a2d; margin-bottom: 16px; }

        .bar-chart { display: flex; flex-direction: column; gap: 10px; }
        .bar-item { display: flex; align-items: center; gap: 10px; }
        .bar-label { min-width: 80px; font-size: 0.85rem; color: #666; }
        .bar-track { flex: 1; height: 32px; background: #f5f0e8; border-radius: 6px; position: relative; overflow: hidden; }
        .bar-fill {
          height: 100%; background: linear-gradient(90deg, #7ab87a, #2d4a2d);
          border-radius: 6px; display: flex; align-items: center; justify-content: flex-end;
          padding: 0 10px; color: #fff; font-size: 0.8rem; font-weight: 600;
        }

        .day-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .day-card {
          background: #faf8f4; padding: 12px 8px; border-radius: 10px;
          text-align: center; border: 2px solid transparent;
          transition: all 0.2s;
        }
        .day-card.best { border-color: #7ab87a; background: #f0f7f0; }
        .day-label { font-size: 0.7rem; color: #999; margin-bottom: 4px; }
        .day-value { font-size: 1.2rem; font-weight: 700; color: #2d4a2d; }
        .day-subtext { font-size: 0.7rem; color: #666; margin-top: 2px; }
      `}</style>

      <div className="page">
        <a href="/owner" className="back">← Back to Dashboard</a>

        <div className="header">
          <div className="title">Performance Analytics</div>
        </div>

        <div className="range-tabs">
          <button 
            className={`range-tab ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Last 7 Days
          </button>
          <button 
            className={`range-tab ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Last 30 Days
          </button>
          <button 
            className={`range-tab ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Earnings</div>
            <div className="stat-value">${analytics.totalEarnings.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{analytics.completedRequests}</div>
            <div className="stat-subtext">errands</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg per Errand</div>
            <div className="stat-value">${analytics.averageEarnings.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Customer Rating</div>
            <div className="stat-value">{analytics.averageRating.toFixed(1)} ⭐</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Peak Hours</div>
          <div className="bar-chart">
            {analytics.topHours.slice(0, 5).map(h => {
              const maxEarnings = analytics.topHours[0].earnings;
              const percentage = (h.earnings / maxEarnings) * 100;
              const timeLabel = h.hour === 0 ? '12am' : h.hour < 12 ? `${h.hour}am` : h.hour === 12 ? '12pm' : `${h.hour - 12}pm`;
              
              return (
                <div key={h.hour} className="bar-item">
                  <div className="bar-label">{timeLabel}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${percentage}%` }}>
                      ${h.earnings.toFixed(0)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {peakHour && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f0f7f0', borderRadius: '8px', fontSize: '0.85rem', color: '#2d4a2d' }}>
              💡 Your best hour is {peakHour.hour === 0 ? '12am' : peakHour.hour < 12 ? `${peakHour.hour}am` : peakHour.hour === 12 ? '12pm' : `${peakHour.hour - 12}pm`} with ${peakHour.count} errands and ${peakHour.earnings.toFixed(0)} earned
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Last 7 Days</div>
          <div className="day-grid">
            {analytics.last7Days.map(day => (
              <div key={day.date} className={`day-card ${day.date === bestDay.date ? 'best' : ''}`}>
                <div className="day-label">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="day-value">${day.earnings.toFixed(0)}</div>
                <div className="day-subtext">{day.requests} errands</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Insights</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', background: '#faf8f4', borderRadius: '10px', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#2d4a2d' }}>Customer Retention:</strong> {analytics.customerRetention}% of your customers have used you more than once. {analytics.customerRetention < 50 ? 'Try following up with first-time customers to encourage repeat business.' : 'Great job building loyalty!'}
            </div>
            <div style={{ padding: '14px', background: '#faf8f4', borderRadius: '10px', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#2d4a2d' }}>Best Day:</strong> {new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} was your strongest day with ${bestDay.earnings.toFixed(2)} earned from {bestDay.requests} errands.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
