// netlify/functions/requests-create.js
// Creates a request + auto-routes + fires push notifications

const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const {
      customerId,
      title,
      pickupStreet,
      pickupCity,
      pickupState,
      pickupZip,
      deliveryStreet,
      deliveryCity,
      deliveryState,
      deliveryZip,
      deliveryInstructions,
      offeredAmount,
      paymentMethod,
      pickupFlexibility,
      deliveryFlexibility,
      preferredDeliveryTime,
      merchantId
    } = body;

    if (!customerId || !title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const sql = neon(process.env.DATABASE_URL);

    // Determine time slot from flexibility/time
    let timeSlot = 'morning';
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 12 && hour < 17) timeSlot = 'afternoon';
    else if (hour >= 17) timeSlot = 'evening';

    // Auto-routing: Check for territory owner matching ZIP + time slot
    let assignedTo = null;

    if (deliveryZip) {
      const territories = await sql`
        SELECT t.id, t.owner_id
        FROM territories t
        WHERE ${deliveryZip} = ANY(t.zip_codes)
        AND ${timeSlot} = ANY(t.time_slots)
        AND t.owner_id IS NOT NULL
        AND t.status = 'active'
        LIMIT 1
      `;

      if (territories.length > 0) {
        assignedTo = territories[0].owner_id;
      }
    }

    // Create the request
    const result = await sql`
      INSERT INTO requests (
        customer_id,
        title,
        pickup_street,
        pickup_city,
        pickup_state,
        pickup_zip,
        delivery_street,
        delivery_city,
        delivery_state,
        delivery_zip,
        delivery_instructions,
        offered_amount,
        payment_method,
        pickup_flexibility,
        delivery_flexibility,
        preferred_delivery_time,
        merchant_id,
        assigned_to,
        status
      ) VALUES (
        ${customerId},
        ${title},
        ${pickupStreet || null},
        ${pickupCity || null},
        ${pickupState || null},
        ${pickupZip || null},
        ${deliveryStreet || null},
        ${deliveryCity || null},
        ${deliveryState || null},
        ${deliveryZip || null},
        ${deliveryInstructions || null},
        ${offeredAmount || null},
        ${paymentMethod || null},
        ${pickupFlexibility || 'asap'},
        ${deliveryFlexibility || 'asap'},
        ${preferredDeliveryTime || null},
        ${merchantId || null},
        ${assignedTo},
        'open'
      )
      RETURNING *
    `;

    const newRequest = result[0];

    // Fire push notifications asynchronously (don't block the response)
    firePushNotifications(newRequest, assignedTo, timeSlot).catch(err => {
      console.error('Push notification error (non-blocking):', err);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        request: newRequest,
        autoAssigned: !!assignedTo
      })
    };
  } catch (err) {
    console.error('requests-create error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

async function firePushNotifications(request, assignedTo, timeSlot) {
  const sql = neon(process.env.DATABASE_URL);
  let targetUserIds = [];

  if (assignedTo) {
    // Notify the specific territory owner
    targetUserIds = [assignedTo];
  } else {
    // Notify ALL active runners
    const runners = await sql`
      SELECT id FROM users
      WHERE role = 'runner'
      AND status = 'active'
    `;
    targetUserIds = runners.map(r => r.id);
  }

  if (!targetUserIds.length) return;

  const notificationPayload = {
    userIds: targetUserIds,
    title: assignedTo ? '📦 New Request In Your Territory' : '📦 New Job Available',
    body: `${request.title}${request.offered_amount ? ` — $${request.offered_amount}` : ''}`,
    url: assignedTo ? '/owner' : '/'
  };

  // Call push-send function internally
  const baseUrl = process.env.URL || 'http://localhost:8888';
  await fetch(`${baseUrl}/.netlify/functions/push-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationPayload)
  });
}
