// netlify/functions/requests-accept.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.request_id || !data.driver_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "request_id and driver_id required" }),
      };
    }

    // Update request to accepted status and assign driver
    const result = await sql`
      UPDATE requests
      SET status = 'accepted',
          assigned_to = ${data.driver_id}
      WHERE id = ${data.request_id}
        AND status = 'open'
      RETURNING *
    `;

    if (result.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request already accepted or not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("requests-accept error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
