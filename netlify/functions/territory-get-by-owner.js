// netlify/functions/territory-get-by-owner.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const owner_id = event.queryStringParameters?.owner_id;

    if (!owner_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "owner_id is required" }),
      };
    }

    const result = await sql`
      SELECT *
      FROM territories
      WHERE owner_id = ${owner_id}
      LIMIT 1
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0] || null),
    };
  } catch (err) {
    console.error("territory-get-by-owner error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
