// netlify/functions/territories-marketplace.js
// Returns available territories with demand metrics

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // Get available territories
    const territories = await sql`
      SELECT 
        t.id,
        t.name,
        t.zip_codes,
        t.price,
        t.time_slot_days,
        t.time_slot_start,
        t.time_slot_end
      FROM territories t
      WHERE t.status = 'available'
      ORDER BY t.created_at DESC
    `;

    // For each territory, calculate request count from last 30 days
    const enriched = await Promise.all(
      territories.map(async (t) => {
        const countRes = await sql`
          SELECT COUNT(*) as count
          FROM requests
          WHERE delivery_zip = ANY(${t.zip_codes})
            AND created_at > NOW() - INTERVAL '30 days'
        `;

        const requestCount = parseInt(countRes[0]?.count || 0);
        
        // Estimate monthly earnings (avg $15 per request)
        const estimatedMonthly = requestCount * 15;

        return {
          ...t,
          request_count_30d: requestCount,
          estimated_monthly: estimatedMonthly,
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(enriched),
    };
  } catch (err) {
    console.error("territories-marketplace error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
