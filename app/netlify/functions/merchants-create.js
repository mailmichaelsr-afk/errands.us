// netlify/functions/merchants-create.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const data = JSON.parse(event.body);

  const result = await sql`
    INSERT INTO merchants
      (name, category, address, phone, hours, website, submitted_by, status)
    VALUES
      (${data.name},
       ${data.category},
       ${data.address || null},
       ${data.phone || null},
       ${data.hours || null},
       ${data.website || null},
       ${data.submitted_by || 'anonymous'},
       'pending')
    RETURNING *
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(result[0]),
  };
}
