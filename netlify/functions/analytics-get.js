// netlify/functions/analytics-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const owner_id = event.queryStringParameters?.owner_id;
    const range = event.queryStringParameters?.range || 'week';

    if (!owner_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "owner_id is required" }),
      };
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    if (range === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date('2020-01-01'); // All time
    }

    // Get completed requests in range
    const completed = await sql`
      SELECT 
        id,
        offered_amount,
        tip_amount,
        completed_at,
        customer_id,
        EXTRACT(HOUR FROM actual_pickup_time) as pickup_hour
      FROM requests
      WHERE assigned_to = ${owner_id}
        AND status = 'completed'
        AND completed_at >= ${startDate.toISOString()}
    `;

    // Calculate metrics
    const totalEarnings = completed.reduce((sum, r) => 
      sum + (r.offered_amount || 0) + (r.tip_amount || 0), 0
    );

    const completedRequests = completed.length;
    const averageEarnings = completedRequests > 0 ? totalEarnings / completedRequests : 0;

    // Top hours
    const hourMap: { [key: number]: { count: number; earnings: number } } = {};
    completed.forEach(r => {
      const hour = r.pickup_hour || 12;
      if (!hourMap[hour]) hourMap[hour] = { count: 0, earnings: 0 };
      hourMap[hour].count++;
      hourMap[hour].earnings += (r.offered_amount || 0) + (r.tip_amount || 0);
    });

    const topHours = Object.entries(hourMap)
      .map(([hour, data]) => ({ hour: parseInt(hour), ...data }))
      .sort((a, b) => b.earnings - a.earnings);

    // Last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRequests = completed.filter(r => 
        r.completed_at?.startsWith(dateStr)
      );

      const dayEarnings = dayRequests.reduce((sum, r) => 
        sum + (r.offered_amount || 0) + (r.tip_amount || 0), 0
      );

      last7Days.push({
        date: dateStr,
        earnings: dayEarnings,
        requests: dayRequests.length
      });
    }

    // Customer retention
    const uniqueCustomers = new Set(completed.map(r => r.customer_id).filter(Boolean));
    const repeatCustomers = new Set();
    
    completed.forEach(r => {
      if (r.customer_id) {
        const customerRequests = completed.filter(req => req.customer_id === r.customer_id);
        if (customerRequests.length > 1) {
          repeatCustomers.add(r.customer_id);
        }
      }
    });

    const customerRetention = uniqueCustomers.size > 0 
      ? Math.round((repeatCustomers.size / uniqueCustomers.size) * 100)
      : 0;

    // Average rating
    const ratings = await sql`
      SELECT AVG(rating) as avg_rating
      FROM ratings
      WHERE to_user_id = ${owner_id}
    `;

    const averageRating = ratings[0]?.avg_rating || 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalEarnings,
        completedRequests,
        averageEarnings,
        topHours,
        last7Days,
        customerRetention,
        averageRating: parseFloat(averageRating)
      }),
    };
  } catch (err) {
    console.error("analytics-get error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
