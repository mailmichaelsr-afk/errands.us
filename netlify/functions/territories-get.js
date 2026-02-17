// netlify/functions/territories-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT 
        t.*,
        u.full_name as owner_name,
        u.email as owner_email
      FROM territories t
      LEFT JOIN users u ON t.owner_id = u.id
      ORDER BY 
        CASE t.status
          WHEN 'available' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'sold' THEN 3
        END,
        t.name ASC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (err) {
    console.error("territories-get error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
