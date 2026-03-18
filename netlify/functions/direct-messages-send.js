// netlify/functions/direct-messages-send.js

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
    const { from_user_id, to_user_id, body } = JSON.parse(event.body);

    if (!from_user_id || !to_user_id || !body?.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'from_user_id, to_user_id, and body are required' }) };
    }

    const result = await sql`
      INSERT INTO direct_messages (from_user_id, to_user_id, body)
      VALUES (${from_user_id}, ${to_user_id}, ${body.trim()})
      RETURNING *
    `;

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: result[0] }) };
  } catch (err) {
    console.error('direct-messages-send error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
