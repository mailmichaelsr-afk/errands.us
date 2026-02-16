// netlify/functions/availability-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler() {
  const sql = neon(process.env.DATABASE_URL);

  const rows = await sql`
    SELECT *
    FROM runner_availability
    WHERE is_available=true
    ORDER BY updated_at DESC
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(rows),
  };
}
