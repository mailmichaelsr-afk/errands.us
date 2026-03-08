// netlify/functions/requests-create.js - FINAL with proper routing logic

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    // Build pickup and delivery addresses
    const pickupAddress = [
      data.pickup_street,
      data.pickup_city,
      data.pickup_state,
      data.pickup_zip
    ].filter(Boolean).join(", ");

    const deliveryAddress = [
      data.delivery_street,
      data.delivery_city,
      data.delivery_state,
      data.delivery_zip
    ].filter(Boolean).join(", ");

    // Find territory by delivery ZIP
    let territory = null;
    let assignedTo = null;

    if (data.delivery_zip) {
      const territoryResult = await sql`
        SELECT id, owner_id, status
        FROM territories
        WHERE ${data.delivery_zip} = ANY(zip_codes)
        LIMIT 1
      `;

      if (territoryResult.length > 0) {
        territory = territoryResult[0];
        
        // Only auto-assign if territory has an owner (is claimed)
        if (territory.owner_id && territory.status === 'sold') {
          assignedTo = territory.owner_id;
        }
        // If territory exists but no owner (available), leave assigned_to null
        // so all independent drivers can see it
      }
    }

    // Create request
    const result = await sql`
      INSERT INTO requests (
        title,
        description,
        pickup,
        dropoff,
        pickup_street,
        pickup_city,
        pickup_state,
        pickup_zip,
        delivery_street,
        delivery_city,
        delivery_state,
        delivery_zip,
        customer_id,
        status,
        pickup_time,
        pickup_flexibility,
        delivery_time,
        delivery_flexibility,
        offered_amount,
        payment_method,
        payment_notes,
        assigned_to,
        created_at
      ) VALUES (
        ${data.title},
        ${data.description || ""},
        ${pickupAddress},
        ${deliveryAddress},
        ${data.pickup_street || null},
        ${data.pickup_city || null},
        ${data.pickup_state || null},
        ${data.pickup_zip || null},
        ${data.delivery_street || null},
        ${data.delivery_city || null},
        ${data.delivery_state || null},
        ${data.delivery_zip || null},
        ${data.customer_id},
        'open',
        ${data.pickup_time || null},
        ${data.pickup_flexibility || 'flexible'},
        ${data.delivery_time || null},
        ${data.delivery_flexibility || 'flexible'},
        ${data.offered_amount || null},
        ${data.payment_method || 'Cash'},
        ${data.payment_notes || null},
        ${assignedTo},
        NOW()
      )
      RETURNING *
    `;

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
