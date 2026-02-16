// netlify/functions/messages-create.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.request_id || !data.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "request_id and body are required" }),
      };
    }

    const result = await sql`
      INSERT INTO messages (request_id, sender_id, sender_name, body, created_at)
      VALUES (
        ${data.request_id},
        ${data.sender_id || null},
        ${data.sender_name || 'Anonymous'},
        ${data.body},
        NOW()
      )
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("messages-create error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
