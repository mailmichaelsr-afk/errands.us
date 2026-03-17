// netlify/functions/requests-update-offer.js
// Lets a customer update the offered amount on their open request

const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { request_id, customer_id, offered_amount } = JSON.parse(event.body);

    if (!request_id || !customer_id || offered_amount == null) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'request_id, customer_id, and offered_amount are required' })
      };
    }

    const sql = neon(process.env.DATABASE_URL);

    // Only allow customer to update their own open request
    const result = await sql`
      UPDATE requests
      SET offered_amount = ${parseFloat(offered_amount)}
      WHERE id = ${request_id}
        AND customer_id = ${customer_id}
        AND status = 'open'
      RETURNING *
    `;

    if (result.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request not found, already accepted, or not yours' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, request: result[0] })
    };
  } catch (err) {
    console.error('requests-update-offer error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
