// netlify/functions/territories-assign.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { territory_id, user_id } = JSON.parse(event.body);

    if (!territory_id || !user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "territory_id and user_id are required" }),
      };
    }

    const result = await sql`
      UPDATE territories
      SET owner_id = ${user_id},
          status = 'sold',
          assigned_at = NOW()
      WHERE id = ${territory_id}
      RETURNING *
    `;

    // Log activity
    await sql`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, created_at)
      VALUES (${user_id}, 'territory_assigned', 'territory', ${territory_id}, NOW())
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("territories-assign error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
