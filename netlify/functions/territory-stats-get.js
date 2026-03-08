// netlify/functions/territory-stats-get.js
// Get comprehensive stats for a territory

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { territory_id, owner_id } = event.queryStringParameters || {};

    if (!territory_id && !owner_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "territory_id or owner_id required" }),
      };
    }

    let whereClause = '';
    let params = [];
    
    if (territory_id) {
      // Get stats for specific territory
      const territory = await sql`
        SELECT owner_id FROM territories WHERE id = ${territory_id}
      `;
      if (!territory.length) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Territory not found" }),
        };
      }
      whereClause = 'WHERE t.id = $1';
      params = [territory_id];
    } else {
      // Get stats for all territories owned by this user
      whereClause = 'WHERE t.owner_id = $1';
      params = [owner_id];
    }

    // Get comprehensive territory stats
    const query = `
      SELECT 
        t.id as territory_id,
        t.name as territory_name,
        t.zip_codes,
        t.price as monthly_price,
        
        -- Request counts
        COUNT(DISTINCT r.id) as total_requests,
        COUNT(DISTINCT CASE WHEN r.status = 'open' THEN r.id END) as open_requests,
        COUNT(DISTINCT CASE WHEN r.status = 'accepted' THEN r.id END) as accepted_requests,
        COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as completed_requests,
        
        -- Time-based request counts
        COUNT(DISTINCT CASE WHEN r.created_at >= NOW() - INTERVAL '7 days' THEN r.id END) as requests_last_7_days,
        COUNT(DISTINCT CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN r.id END) as requests_last_30_days,
        COUNT(DISTINCT CASE WHEN r.created_at >= DATE_TRUNC('month', NOW()) THEN r.id END) as requests_this_month,
        
        -- Earnings
        SUM(CASE WHEN r.status = 'completed' THEN COALESCE(r.offered_amount, 0) END) as total_earnings,
        SUM(CASE WHEN r.status = 'completed' AND r.created_at >= NOW() - INTERVAL '30 days' 
            THEN COALESCE(r.offered_amount, 0) END) as earnings_last_30_days,
        SUM(CASE WHEN r.status = 'completed' AND r.created_at >= DATE_TRUNC('month', NOW()) 
            THEN COALESCE(r.offered_amount, 0) END) as earnings_this_month,
        
        -- Average metrics
        AVG(CASE WHEN r.status = 'completed' THEN COALESCE(r.offered_amount, 0) END) as avg_earnings_per_request,
        AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating END) as avg_rating,
        
        -- Customer metrics
        COUNT(DISTINCT r.customer_id) as unique_customers,
        COUNT(DISTINCT CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' 
            THEN r.customer_id END) as active_customers_30_days
        
      FROM territories t
      LEFT JOIN requests r ON (
        r.delivery_zip = ANY(t.zip_codes)
        AND r.assigned_to = t.owner_id
      )
      ${whereClause}
      GROUP BY t.id, t.name, t.zip_codes, t.price
    `;

    const stats = territory_id 
      ? await sql.unsafe(query.replace('$1', `'${territory_id}'`))
      : await sql.unsafe(query.replace('$1', `'${owner_id}'`));

    // Calculate growth rate (compare last 30 days to previous 30 days)
    if (stats.length > 0) {
      for (let stat of stats) {
        const growthQuery = `
          SELECT 
            COUNT(*) as previous_month_requests
          FROM requests r
          JOIN territories t ON r.delivery_zip = ANY(t.zip_codes) AND r.assigned_to = t.owner_id
          WHERE t.id = $1
            AND r.created_at >= NOW() - INTERVAL '60 days'
            AND r.created_at < NOW() - INTERVAL '30 days'
        `;
        
        const growth = await sql.unsafe(growthQuery.replace('$1', `'${stat.territory_id}'`));
        const prevMonth = growth[0]?.previous_month_requests || 0;
        const currentMonth = stat.requests_last_30_days || 0;
        
        stat.growth_rate = prevMonth === 0 
          ? (currentMonth > 0 ? 100 : 0)
          : Math.round(((currentMonth - prevMonth) / prevMonth) * 100);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(territory_id ? stats[0] || {} : stats),
    };
  } catch (err) {
    console.error("territory-stats-get error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
