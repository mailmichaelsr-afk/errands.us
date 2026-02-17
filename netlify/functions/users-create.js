// netlify/functions/users-create.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.email || !data.full_name || !data.role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "email, full_name, and role are required" }),
      };
    }

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${data.email}
    `;
    
    if (existing.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify(existing[0]),
      };
    }

    const result = await sql`
      INSERT INTO users
        (email, full_name, phone, role, status, avatar_url, created_at)
      VALUES
        (${data.email},
         ${data.full_name},
         ${data.phone || null},
         ${data.role},
         ${data.status || 'active'},
         ${data.avatar_url || null},
         NOW())
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
