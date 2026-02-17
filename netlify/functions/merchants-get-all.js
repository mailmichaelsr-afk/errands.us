// netlify/functions/merchants-get-all.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT *
      FROM merchants
      ORDER BY 
        CASE status
          WHEN 'pending' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'rejected' THEN 3
        END,
        created_at DESC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (err) {
    console.error("merchants-get-all error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
