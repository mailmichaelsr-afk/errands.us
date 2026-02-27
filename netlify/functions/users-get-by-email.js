// netlify/functions/users-get-by-email.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const email = event.queryStringParameters?.email;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "email is required" }),
      };
    }

    const result = await sql`
      SELECT id, email, full_name, role, status, phone, avatar_url
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (result.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("users-get-by-email error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
