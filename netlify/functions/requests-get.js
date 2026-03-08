// netlify/functions/requests-get.js - UPDATED to include driver info

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const requests = await sql`
      SELECT 
        r.*,
        c.full_name as customer_name,
        c.email as customer_email,
        d.full_name as driver_name,
        d.email as driver_email
      FROM requests r
      LEFT JOIN users c ON r.customer_id = c.id
      LEFT JOIN users d ON r.assigned_to = d.id
      ORDER BY r.created_at DESC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(requests),
    };
  } catch (err) {
    console.error("requests-get error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
