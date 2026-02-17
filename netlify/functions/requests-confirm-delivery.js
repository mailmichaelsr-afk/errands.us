// netlify/functions/requests-confirm-delivery.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = JSON.parse(event.body);

    const result = await sql`
      UPDATE requests
      SET delivery_confirmed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("requests-confirm-delivery error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
