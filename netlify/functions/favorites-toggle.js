// netlify/functions/favorites-toggle.js

const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { customer_id, runner_id } = JSON.parse(event.body);

    if (!customer_id || !runner_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'customer_id and runner_id required' }) };
    }

    // Check if already favorited
    const existing = await sql`
      SELECT id FROM favorites WHERE customer_id = ${customer_id} AND runner_id = ${runner_id}
    `;

    if (existing.length > 0) {
      // Remove favorite
      await sql`DELETE FROM favorites WHERE customer_id = ${customer_id} AND runner_id = ${runner_id}`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, favorited: false }) };
    } else {
      // Add favorite
      await sql`INSERT INTO favorites (customer_id, runner_id) VALUES (${customer_id}, ${runner_id})`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, favorited: true }) };
    }
  } catch (err) {
    console.error('favorites-toggle error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
