// netlify/functions/merchants-get-for-user.js
// Get merchants for a specific user and ZIP (excludes hidden ones)

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const params = new URLSearchParams(event.queryStringParameters || {});
    const user_id = params.get("user_id");
    const zip = params.get("zip");

    if (!user_id || !zip) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "user_id and zip required" }),
      };
    }

    // Get merchants that are:
    // 1. In the requested ZIP and NOT personal (shared by everyone)
    // 2. OR created by this user (their personal ones from any ZIP)
    // MINUS any they've hidden
    const merchants = await sql`
      SELECT DISTINCT m.*
      FROM merchants m
      WHERE m.status = 'approved'
        AND m.id NOT IN (
          SELECT merchant_id FROM hidden_merchants WHERE user_id = ${user_id}
        )
        AND (
          (m.zip = ${zip} AND m.is_personal = false)
          OR m.created_by = ${user_id}
        )
      ORDER BY m.name ASC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(merchants),
    };
  } catch (err) {
    console.error("merchants-get-for-user error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
