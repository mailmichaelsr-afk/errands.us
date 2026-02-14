// netlify/functions/requests-create.js

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  const data = JSON.parse(event.body);

  const result = await sql`
    INSERT INTO requests
      (title, description, pickup, dropoff, created_by,
       scheduled_time, preferred_runner_id, territory_key)
    VALUES
      (${data.title},
       ${data.description || null},
       ${data.pickup},
       ${data.dropoff},
       ${data.created_by || null},
       ${data.scheduled_time || null},
       ${data.preferred_runner_id || null},
       ${data.territory_key || null})
    RETURNING *
  `;

  return {
    statusCode: 200,
    body: JSON.stringify(result[0]),
  };
}
