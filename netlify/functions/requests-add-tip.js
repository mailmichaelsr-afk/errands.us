// netlify/functions/requests-add-tip.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id, tip_amount } = JSON.parse(event.body);

    const result = await sql`
      UPDATE requests
      SET tip_amount = ${tip_amount}
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("requests-add-tip error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
