// netlify/functions/merchants-get-all.js
// Get all merchants with creator information for admin

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const merchants = await sql`
      SELECT 
        m.*,
        u.full_name as created_by_name,
        u.email as created_by_email
      FROM merchants m
      LEFT JOIN users u ON m.created_by = u.id
      ORDER BY m.created_at DESC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(merchants),
    };
  } catch (err) {
    console.error("merchants-get-all error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
