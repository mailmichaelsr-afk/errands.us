// netlify/functions/users-update-status.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { user_id, status } = JSON.parse(event.body);

    if (!user_id || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "user_id and status are required" }),
      };
    }

    const result = await sql`
      UPDATE users
      SET status = ${status}
      WHERE id = ${user_id}
      RETURNING *
    `;

    // Log activity
    await sql`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (${user_id}, 'status_changed', 'user', ${user_id}, 
              jsonb_build_object('new_status', ${status}), NOW())
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("users-update-status error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
