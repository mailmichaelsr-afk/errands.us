// netlify/functions/requests-get-by-owner.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const owner_id = event.queryStringParameters?.owner_id;

    if (!owner_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "owner_id is required" }),
      };
    }

    const rows = await sql`
      SELECT 
        r.*,
        u.full_name as customer_name
      FROM requests r
      LEFT JOIN users u ON r.customer_id = u.id
      WHERE r.assigned_to = ${owner_id}
        OR r.territory_id IN (
          SELECT id FROM territories WHERE owner_id = ${owner_id}
        )
      ORDER BY 
        CASE r.status
          WHEN 'open' THEN 1
          WHEN 'accepted' THEN 2
          ELSE 3
        END,
        COALESCE(r.pickup_time, r.created_at) ASC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (err) {
    console.error("requests-get-by-owner error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
