// netlify/functions/merchants-moderate.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const { id, status } = JSON.parse(event.body); // status: 'approved' | 'rejected'

  const result = await sql`
    UPDATE merchants
    SET status = ${status}
    WHERE id = ${id}
    RETURNING *
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(result[0]),
  };
}
