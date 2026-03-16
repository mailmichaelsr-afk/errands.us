// netlify/functions/merchants-hide.js
// Hide a merchant from a user's list (doesn't delete it)

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { user_id, merchant_id } = JSON.parse(event.body);

    if (!user_id || !merchant_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "user_id and merchant_id required" }),
      };
    }

    await sql`
      INSERT INTO hidden_merchants (user_id, merchant_id, hidden_at)
      VALUES (${user_id}, ${merchant_id}, NOW())
      ON CONFLICT (user_id, merchant_id) DO NOTHING
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("merchants-hide error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
