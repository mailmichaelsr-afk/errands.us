// netlify/functions/requests-create.js - Routes by ZIP + TIME SLOT

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

    // Find territory by delivery ZIP + current time slot
    let territory = null;
    let assignedTo = null;

    if (data.delivery_zip) {
      // Get current day and time
      const now = new Date();
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const currentDay = dayNames[now.getDay()];
      const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS

      // Find territory that matches ZIP, has this day, and is within time range
      const territoryResult = await sql`
        SELECT id, owner_id, status, name
        FROM territories
        WHERE ${data.delivery_zip} = ANY(zip_codes)
          AND ${currentDay} = ANY(time_slot_days)
          AND time_slot_start <= ${currentTime}::time
          AND time_slot_end >= ${currentTime}::time
          AND status = 'sold'
        LIMIT 1
      `;

      if (territoryResult.length > 0) {
        territory = territoryResult[0];
        
        // Auto-assign to territory owner
        if (territory.owner_id) {
          assignedTo = territory.owner_id;
        }
      }
      // If no matching territory found, assigned_to stays null
      // so all independent drivers can see it
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
