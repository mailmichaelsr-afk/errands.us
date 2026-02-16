// netlify/functions/requests-create.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.title || !data.pickup || !data.dropoff) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "title, pickup and dropoff are required" }),
      };
    }

    const result = await sql`
      INSERT INTO requests
        (title, description, pickup, dropoff, status, created_by, created_at)
      VALUES
        (${data.title},
         ${data.description || null},
         ${data.pickup},
         ${data.dropoff},
         'open',
         ${data.created_by || null},
         NOW())
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("requests-create error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
