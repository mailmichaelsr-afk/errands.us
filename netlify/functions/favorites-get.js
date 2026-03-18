// netlify/functions/favorites-get.js

const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { customer_id } = event.queryStringParameters || {};

    if (!customer_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'customer_id required' }) };
    }

    const favorites = await sql`
      SELECT 
        u.id, u.full_name, u.phone, u.zip, u.service_zip, u.runner_status,
        f.created_at as favorited_at
      FROM favorites f
      JOIN users u ON f.runner_id = u.id
      WHERE f.customer_id = ${customer_id}
      ORDER BY u.runner_status DESC, u.full_name ASC
    `;

    return { statusCode: 200, headers, body: JSON.stringify(favorites) };
  } catch (err) {
    console.error('favorites-get error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
