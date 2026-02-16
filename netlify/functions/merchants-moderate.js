// netlify/functions/merchants-moderate.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id, status } = JSON.parse(event.body);

    if (!id || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "id and status are required" }),
      };
    }

    const result = await sql`
      UPDATE merchants
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("merchants-moderate error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
