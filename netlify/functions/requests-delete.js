// netlify/functions/requests-delete.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request ID is required" }),
      };
    }

    // Delete associated messages first
    await sql`
      DELETE FROM messages WHERE request_id = ${data.id}
    `;

    // Delete the request
    await sql`
      DELETE FROM requests WHERE id = ${data.id}
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("requests-delete error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
