import { neon } from "@neondatabase/serverless";

export const config = {
  runtime: "nodejs",
};

export async function handler() {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT id, title, pickup, dropoff
      FROM requests
      ORDER BY created_at DESC
    `;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rows),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
