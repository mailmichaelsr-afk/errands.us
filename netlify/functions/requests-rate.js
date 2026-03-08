// netlify/functions/requests-rate.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.request_id || !data.rating) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "request_id and rating required" }),
      };
    }

    const result = await sql`
      UPDATE requests
      SET rating = ${data.rating},
          review = ${data.review || null}
      WHERE id = ${data.request_id}
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("requests-rate error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
