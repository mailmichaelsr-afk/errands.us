// netlify/functions/merchants-create-admin.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.name || !data.category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Name and category are required" }),
      };
    }

    const result = await sql`
      INSERT INTO merchants (name, category, address, phone, hours, website, submitted_by, status, created_at)
      VALUES (
        ${data.name},
        ${data.category},
        ${data.address || null},
        ${data.phone || null},
        ${data.hours || null},
        ${data.website || null},
        'admin',
        'approved',
        NOW()
      )
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("merchants-create-admin error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
