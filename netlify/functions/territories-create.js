// netlify/functions/territories-create.js (v2 with time slots)

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.name || !data.zip_codes) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "name and zip_codes are required" }),
      };
    }

    // Default to 24/7 if no time slots specified
    const timeDays = data.time_slot_days || ['mon','tue','wed','thu','fri','sat','sun'];
    const timeStart = data.time_slot_start || '00:00:00';
    const timeEnd = data.time_slot_end || '23:59:59';

    const result = await sql`
      INSERT INTO territories
        (name, zip_codes, price, monthly_fee, status, 
         time_slot_days, time_slot_start, time_slot_end, created_at)
      VALUES
        (${data.name},
         ${data.zip_codes},
         ${data.price || null},
         ${data.monthly_fee || null},
         ${data.status || 'available'},
         ${timeDays},
         ${timeStart},
         ${timeEnd},
         NOW())
      RETURNING *
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("territories-create error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
