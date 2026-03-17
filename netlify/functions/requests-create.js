// netlify/functions/requests-create.js
// Creates a request + auto-routes + fires push notifications

const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);

    // Accept both snake_case (from frontend) and camelCase (legacy)
    const customerId = body.customer_id || body.customerId;
    const title = body.title;
    const pickupStreet = body.pickup_street || body.pickupStreet || null;
    const pickupCity = body.pickup_city || body.pickupCity || null;
    const pickupState = body.pickup_state || body.pickupState || null;
    const pickupZip = body.pickup_zip || body.pickupZip || null;
    const deliveryStreet = body.delivery_street || body.deliveryStreet || null;
    const deliveryCity = body.delivery_city || body.deliveryCity || null;
    const deliveryState = body.delivery_state || body.deliveryState || null;
    const deliveryZip = body.delivery_zip || body.deliveryZip || null;
    const deliveryInstructions = body.delivery_instructions || body.deliveryInstructions || null;
    const offeredAmount = body.offered_amount || body.offeredAmount || null;
    const paymentMethod = body.payment_method || body.paymentMethod || null;
    const paymentNotes = body.payment_notes || body.paymentNotes || null;
    const pickupFlexibility = body.pickup_flexibility || body.pickupFlexibility || 'asap';
    const deliveryFlexibility = body.delivery_flexibility || body.deliveryFlexibility || 'asap';
    const preferredDeliveryTime = body.preferred_delivery_time || body.preferredDeliveryTime || null;
    const merchantId = body.merchant_id || body.merchantId || null;

    if (!customerId || !title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: customer_id and title are required' })
      };
    }

    const sql = neon(process.env.DATABASE_URL);

    // Determine time slot from current hour
    let timeSlot = 'morning';
    const hour = new Date().getHours();
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
        customer_id, title,
        pickup_street, pickup_city, pickup_state, pickup_zip,
        delivery_street, delivery_city, delivery_state, delivery_zip,
        delivery_instructions, offered_amount, payment_method,
        pickup_flexibility, delivery_flexibility, preferred_delivery_time,
        merchant_id, assigned_to, status
      ) VALUES (
        ${customerId}, ${title},
        ${pickupStreet}, ${pickupCity}, ${pickupState}, ${pickupZip},
        ${deliveryStreet}, ${deliveryCity}, ${deliveryState}, ${deliveryZip},
        ${deliveryInstructions}, ${offeredAmount}, ${paymentMethod},
        ${pickupFlexibility}, ${deliveryFlexibility}, ${preferredDeliveryTime},
        ${merchantId}, ${assignedTo}, 'open'
      )
      RETURNING *
    `;

    const newRequest = result[0];

    // Fire push notifications async (don't block response)
    firePushNotifications(newRequest, assignedTo).catch(err => {
      console.error('Push notification error (non-blocking):', err);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        id: newRequest.id,
        ...newRequest,
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

async function firePushNotifications(request, assignedTo) {
  const sql = neon(process.env.DATABASE_URL);
  let targetUserIds = [];

  if (assignedTo) {
    targetUserIds = [assignedTo];
  } else {
    const runners = await sql`
      SELECT id FROM users WHERE role = 'runner' AND status = 'active'
    `;
    targetUserIds = runners.map(r => r.id);
  }

  if (!targetUserIds.length) return;

  const baseUrl = process.env.URL || 'http://localhost:8888';
  await fetch(`${baseUrl}/.netlify/functions/push-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userIds: targetUserIds,
      title: assignedTo ? '📦 New Request In Your Territory' : '📦 New Job Available',
      body: `${request.title}${request.offered_amount ? ` — $${request.offered_amount}` : ''}`,
      url: assignedTo ? '/owner' : '/'
    })
  });
}
