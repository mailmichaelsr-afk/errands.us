// netlify/functions/messages-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const id = event.queryStringParameters.id;

  const rows = await sql`
    SELECT *
    FROM messages
    WHERE request_id=${id}
    ORDER BY created_at ASC
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(rows),
  };
}
