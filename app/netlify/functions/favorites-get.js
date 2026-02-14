// netlify/functions/favorites-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const id = event.queryStringParameters.customer_id;

  const rows = await sql`
    SELECT *
    FROM favorites
    WHERE customer_id=${id}
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(rows),
  };
}
