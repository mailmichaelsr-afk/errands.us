// netlify/functions/direct-messages-get.js

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
    const { user_id, other_user_id } = event.queryStringParameters || {};

    if (!user_id || !other_user_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id and other_user_id required' }) };
    }

    // Get all messages between these two users
    const messages = await sql`
      SELECT dm.*, 
        u.full_name as sender_name
      FROM direct_messages dm
      JOIN users u ON dm.from_user_id = u.id
      WHERE (dm.from_user_id = ${user_id} AND dm.to_user_id = ${other_user_id})
         OR (dm.from_user_id = ${other_user_id} AND dm.to_user_id = ${user_id})
      ORDER BY dm.created_at ASC
    `;

    // Mark messages to this user as read
    await sql`
      UPDATE direct_messages
      SET read = true
      WHERE to_user_id = ${user_id}
        AND from_user_id = ${other_user_id}
        AND read = false
    `;

    return { statusCode: 200, headers, body: JSON.stringify(messages) };
  } catch (err) {
    console.error('direct-messages-get error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
