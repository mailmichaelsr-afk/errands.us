// netlify/functions/merchants-create-user.js
// Drivers/owners create merchants for their ZIP or personal use

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { user_id, name, category, address, zip, phone, hours, website, user_zip } = JSON.parse(event.body);

    if (!user_id || !name || !category || !zip) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "user_id, name, category, and zip required" }),
      };
    }

    // Check if user can add merchants
    const user = await sql`SELECT can_add_merchants FROM users WHERE id = ${user_id}`;
    if (!user[0] || !user[0].can_add_merchants) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "You do not have permission to add merchants" }),
      };
    }

    // Determine if this is personal (outside user's service area)
    const is_personal = user_zip && zip !== user_zip;

    const result = await sql`
      INSERT INTO merchants (
        name, category, address, zip, phone, hours, website,
        created_by, is_personal, status, created_at
      ) VALUES (
        ${name},
        ${category},
        ${address || ""},
        ${zip},
        ${phone || ""},
        ${hours || ""},
        ${website || ""},
        ${user_id},
        ${is_personal},
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
    console.error("merchants-create-user error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
