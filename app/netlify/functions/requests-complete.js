// netlify/functions/requests-complete.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const { id } = JSON.parse(event.body);

  const result = await sql`
    UPDATE requests
    SET status='completed',
        completed_at=NOW()
    WHERE id=${id}
    RETURNING *
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(result[0]),
  };
}
