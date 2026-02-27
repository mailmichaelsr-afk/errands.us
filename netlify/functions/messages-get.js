// netlify/functions/messages-get.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const id = event.queryStringParameters?.id;

    if (!id || id === 'undefined') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Valid request ID is required" }),
      };
    }

    const requestId = parseInt(id);
    
    if (isNaN(requestId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request ID must be a number" }),
      };
    }

    const result = await sql`
      SELECT * FROM messages
      WHERE request_id = ${requestId}
      ORDER BY created_at ASC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("messages-get error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
