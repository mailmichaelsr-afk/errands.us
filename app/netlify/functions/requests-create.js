import { neon } from "@neondatabase/serverless";

export const config = {
  runtime: "nodejs",
};

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.title || !data.pickup || !data.dropoff) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing fields" }),
      };
    }

    const result = await sql`
      INSERT INTO requests (title, pickup, dropoff)
      VALUES (${data.title}, ${data.pickup}, ${data.dropoff})
      RETURNING id, title, pickup, dropoff
    `;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
