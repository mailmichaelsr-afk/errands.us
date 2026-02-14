// netlify/functions/requests-schedule.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const { id, scheduled_time } = JSON.parse(event.body);

  const result = await sql`
    UPDATE requests
    SET scheduled_time=${scheduled_time}
    WHERE id=${id}
    RETURNING *
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(result[0]),
  };
}
