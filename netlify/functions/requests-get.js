// netlify/functions/requests-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT *
      FROM requests
      ORDER BY COALESCE(scheduled_time, created_at) ASC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (err) {
    console.error("requests-get error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
