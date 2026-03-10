// netlify/functions/users-create.js
// Creates DB user record - handles duplicates gracefully

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.netlify_id || !data.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "netlify_id and email required" }),
      };
    }

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE netlify_id = ${data.netlify_id}
    `;

    if (existing.length > 0) {
      console.log("User already exists, skipping creation");
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: "User already exists",
          id: existing[0].id 
        }),
      };
    }

    // Create new user
    const result = await sql`
      INSERT INTO users (
        netlify_id,
        email,
        full_name,
        phone,
        role,
        status,
        created_at
      ) VALUES (
        ${data.netlify_id},
        ${data.email},
        ${data.full_name || ""},
        ${data.phone || null},
        ${data.role || "customer"},
        ${data.status || "active"},
        NOW()
      )
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("users-create error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
