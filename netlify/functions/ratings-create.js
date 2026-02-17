// netlify/functions/ratings-create.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { request_id, from_user_id, to_user_id, rating, review_text } = JSON.parse(event.body);

    if (!request_id || !from_user_id || !to_user_id || !rating) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "request_id, from_user_id, to_user_id, and rating are required" }),
      };
    }

    const result = await sql`
      INSERT INTO ratings (request_id, from_user_id, to_user_id, rating, review_text, created_at)
      VALUES (${request_id}, ${from_user_id}, ${to_user_id}, ${rating}, ${review_text || null}, NOW())
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("ratings-create error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
