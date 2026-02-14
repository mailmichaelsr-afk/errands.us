import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const data = JSON.parse(event.body);

  const result = await sql`
    INSERT INTO messages (request_id,sender_id,body)
    VALUES (${data.request_id},1,${data.body})
    RETURNING *
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(result[0]),
  };
}
