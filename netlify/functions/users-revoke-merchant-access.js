// netlify/functions/users-revoke-merchant-access.js
// Admin can revoke merchant-adding privileges from abusers

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { user_id, can_add } = JSON.parse(event.body);

    if (!user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "user_id required" }),
      };
    }

    await sql`
      UPDATE users
      SET can_add_merchants = ${can_add !== false}
      WHERE id = ${user_id}
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("users-revoke-merchant-access error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
