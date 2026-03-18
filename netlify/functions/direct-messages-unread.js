// netlify/functions/direct-messages-unread.js

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
    const { user_id } = event.queryStringParameters || {};

    if (!user_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id required' }) };
    }

    const result = await sql`
      SELECT COUNT(*) as count
      FROM direct_messages
      WHERE to_user_id = ${user_id} AND read = false
    `;

    return { statusCode: 200, headers, body: JSON.stringify({ unread: parseInt(result[0].count) }) };
  } catch (err) {
    console.error('direct-messages-unread error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
