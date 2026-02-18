// netlify/functions/requests-complete.js (v2 with photo enforcement)

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = JSON.parse(event.body);

    // Check if delivery photo exists
    const request = await sql`
      SELECT delivery_photo_url 
      FROM requests 
      WHERE id = ${id}
    `;

    if (!request[0] || !request[0].delivery_photo_url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: "Delivery photo required",
          message: "Please upload a delivery photo before marking this request complete."
        }),
      };
    }

    const result = await sql`
      UPDATE requests
      SET status = 'completed',
          completed_at = NOW(),
          actual_delivery_time = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("requests-complete error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
