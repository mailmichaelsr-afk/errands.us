// netlify/functions/requests-accept.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id, runner_id } = JSON.parse(event.body);

    const result = await sql`
      UPDATE requests
      SET status = 'accepted',
          accepted_by = ${runner_id}
      WHERE id = ${id}
        AND status = 'open'
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("requests-accept error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
