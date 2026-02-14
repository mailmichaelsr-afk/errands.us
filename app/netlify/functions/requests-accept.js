// netlify/functions/requests-accept.js

import { neon } from "@neondatabase/serverless";

export const config = {
  runtime: "nodejs",
};

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = JSON.parse(event.body);

    const result = await sql`
      UPDATE requests
      SET status='accepted'
      WHERE id=${id}
      RETURNING id,status
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
