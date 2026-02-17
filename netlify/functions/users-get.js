// netlify/functions/users-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT 
        id, email, full_name, phone, role, status, avatar_url, created_at, last_login
      FROM users
      ORDER BY 
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'territory_owner' THEN 2
          WHEN 'customer' THEN 3
        END,
        CASE status
          WHEN 'pending' THEN 1
          WHEN 'active' THEN 2
          WHEN 'suspended' THEN 3
        END,
        created_at DESC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (err) {
    console.error("users-get error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
