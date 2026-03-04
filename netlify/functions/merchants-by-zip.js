// netlify/functions/merchants-by-zip.js
// Returns merchants available for a given delivery ZIP (based on territory)

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const zip = event.queryStringParameters?.zip;

    if (!zip) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "zip required" }),
      };
    }

    // Find territory covering this ZIP with current time
    const now = new Date();
    const targetTime = now.toTimeString().slice(0, 8);
    const targetDay = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];

    const territories = await sql`
      SELECT id, name
      FROM territories
      WHERE status = 'sold'
        AND ${zip} = ANY(zip_codes)
        AND time_in_slot(
          ${targetDay},
          ${targetTime}::TIME,
          time_slot_days,
          time_slot_start,
          time_slot_end
        )
      LIMIT 1
    `;

    if (territories.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          territory: null,
          merchants: [] 
        }),
      };
    }

    const territory = territories[0];

    // Get merchants for this territory
    const merchants = await sql`
      SELECT m.*
      FROM merchants m
      INNER JOIN territory_merchants tm ON m.id = tm.merchant_id
      WHERE tm.territory_id = ${territory.id}
        AND m.status = 'approved'
      ORDER BY m.category, m.name
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({
        territory: territory,
        merchants: merchants
      }),
    };
  } catch (err) {
    console.error("merchants-by-zip error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
