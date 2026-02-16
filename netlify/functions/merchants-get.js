// netlify/functions/merchants-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const category = event.queryStringParameters?.category;

    const rows = category
      ? await sql`
          SELECT * FROM merchants
          WHERE status = 'approved'
            AND category = ${category}
          ORDER BY name ASC
        `
      : await sql`
          SELECT * FROM merchants
          WHERE status = 'approved'
          ORDER BY category ASC, name ASC
        `;

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (err) {
    console.error("merchants-get error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
