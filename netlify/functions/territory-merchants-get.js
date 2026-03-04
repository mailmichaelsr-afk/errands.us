// netlify/functions/territory-merchants-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const territoryId = event.queryStringParameters?.territory_id;

    if (!territoryId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "territory_id required" }),
      };
    }

    const result = await sql`
      SELECT m.*, tm.id as link_id
      FROM merchants m
      INNER JOIN territory_merchants tm ON m.id = tm.merchant_id
      WHERE tm.territory_id = ${parseInt(territoryId)}
        AND m.status = 'approved'
      ORDER BY m.category, m.name
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("territory-merchants-get error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
