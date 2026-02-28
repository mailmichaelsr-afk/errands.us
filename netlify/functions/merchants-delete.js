// netlify/functions/merchants-delete.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Merchant ID is required" }),
      };
    }

    await sql`
      DELETE FROM merchants
      WHERE id = ${data.id}
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("merchants-delete error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
