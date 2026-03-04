// netlify/functions/territory-merchants-remove.js

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

    await sql`
      DELETE FROM territory_merchants
      WHERE territory_id = ${data.territory_id}
        AND merchant_id = ${data.merchant_id}
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("territory-merchants-remove error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
