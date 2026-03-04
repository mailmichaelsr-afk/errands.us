// netlify/functions/territory-merchants-add.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.territory_id || !data.merchant_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "territory_id and merchant_id required" }),
      };
    }

    const result = await sql`
      INSERT INTO territory_merchants (territory_id, merchant_id, added_by, created_at)
      VALUES (${data.territory_id}, ${data.merchant_id}, ${data.user_id || null}, NOW())
      ON CONFLICT (territory_id, merchant_id) DO NOTHING
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0] || { message: "Already added" }),
    };
  } catch (err) {
    console.error("territory-merchants-add error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
