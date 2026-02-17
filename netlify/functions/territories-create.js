// netlify/functions/territories-create.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.name || !data.zip_codes) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "name and zip_codes are required" }),
      };
    }

    const result = await sql`
      INSERT INTO territories
        (name, zip_codes, price, monthly_fee, status, created_at)
      VALUES
        (${data.name},
         ${data.zip_codes},
         ${data.price || null},
         ${data.monthly_fee || null},
         ${data.status || 'available'},
         NOW())
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("territories-create error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
