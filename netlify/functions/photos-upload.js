// netlify/functions/photos-upload.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { request_id, photo_type, photo_data, uploaded_by } = JSON.parse(event.body);

    if (!request_id || !photo_type || !photo_data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "request_id, photo_type, and photo_data are required" }),
      };
    }

    // Store photo URL in requests table for receipt/delivery
    if (photo_type === "receipt") {
      await sql`
        UPDATE requests
        SET receipt_photo_url = ${photo_data}
        WHERE id = ${request_id}
      `;
    } else if (photo_type === "delivery") {
      await sql`
        UPDATE requests
        SET delivery_photo_url = ${photo_data}
        WHERE id = ${request_id}
      `;
    }

    // Also store in photos table for history
    const result = await sql`
      INSERT INTO photos (request_id, uploaded_by, photo_type, url, created_at)
      VALUES (${request_id}, ${uploaded_by || null}, ${photo_type}, ${photo_data}, NOW())
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("photos-upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
