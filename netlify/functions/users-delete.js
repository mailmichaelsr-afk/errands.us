// netlify/functions/users-delete.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "user_id required" }),
      };
    }

    // Delete user (cascades will handle related data)
    await sql`DELETE FROM users WHERE id = ${data.user_id}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("users-delete error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
