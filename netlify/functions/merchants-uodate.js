// netlify/functions/merchants-update.js

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

    const result = await sql`
      UPDATE merchants
      SET name = ${data.name},
          category = ${data.category},
          address = ${data.address || null},
          phone = ${data.phone || null},
          hours = ${data.hours || null},
          website = ${data.website || null}
      WHERE id = ${data.id}
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("merchants-update error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
