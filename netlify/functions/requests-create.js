// netlify/functions/requests-create.js (v3 with territory routing)

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.title || !data.pickup || !data.dropoff) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "title, pickup and dropoff are required" }),
      };
    }

    // Extract zip code from dropoff address (simple regex)
    const zipMatch = data.dropoff.match(/\b\d{5}\b/);
    const dropoffZip = zipMatch ? zipMatch[0] : null;

    let territoryId = null;
    let assignedTo = null;

    // Find territory that covers this zip code
    if (dropoffZip) {
      const territories = await sql`
        SELECT id, owner_id
        FROM territories
        WHERE status = 'sold'
          AND ${dropoffZip} = ANY(zip_codes)
        LIMIT 1
      `;

      if (territories.length > 0) {
        territoryId = territories[0].id;
        assignedTo = territories[0].owner_id;
      }
    }

    // If no territory found, assign to admin
    if (!assignedTo) {
      const admin = await sql`
        SELECT id FROM users WHERE role = 'admin' LIMIT 1
      `;
      if (admin.length > 0) {
        assignedTo = admin[0].id;
      }
    }

    const result = await sql`
      INSERT INTO requests
        (title, description, pickup, dropoff, status, 
         customer_id, territory_id, assigned_to, created_at,
         pickup_time, pickup_flexibility, delivery_time, delivery_flexibility,
         offered_amount, payment_method, payment_notes)
      VALUES
        (${data.title},
         ${data.description || null},
         ${data.pickup},
         ${data.dropoff},
         'open',
         ${data.customer_id || data.created_by || null},
         ${territoryId},
         ${assignedTo},
         NOW(),
         ${data.pickup_time || null},
         ${data.pickup_flexibility || 'flexible'},
         ${data.delivery_time || null},
         ${data.delivery_flexibility || 'flexible'},
         ${data.offered_amount || null},
         ${data.payment_method || null},
         ${data.payment_notes || null})
      RETURNING *
    `;

    // Log activity
    if (territoryId) {
      await sql`
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (${assignedTo}, 'request_routed', 'request', ${result[0].id},
                jsonb_build_object('territory_id', ${territoryId}, 'zip', ${dropoffZip}), NOW())
      `;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("requests-create error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
