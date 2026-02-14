// netlify/functions/favorites-set.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const data = JSON.parse(event.body);

  if (data.is_favorite) {
    await sql`
      INSERT INTO favorites (customer_id,runner_id)
      VALUES (${data.customer_id},${data.runner_id})
      ON CONFLICT DO NOTHING
    `;
  } else {
    await sql`
      DELETE FROM favorites
      WHERE customer_id=${data.customer_id}
        AND runner_id=${data.runner_id}
    `;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
}
