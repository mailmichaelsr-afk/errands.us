// netlify/functions/availability-set.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const data = JSON.parse(event.body);

  const result = await sql`
    INSERT INTO runner_availability (runner_id,is_available,note,updated_at)
    VALUES (${data.runner_id},${data.is_available},${data.note || null},NOW())
    ON CONFLICT (runner_id)
    DO UPDATE SET
      is_available=${data.is_available},
      note=${data.note || null},
      updated_at=NOW()
    RETURNING *
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(result[0]),
  };
}
