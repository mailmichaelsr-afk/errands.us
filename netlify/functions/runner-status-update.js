// netlify/functions/runner-status-update.js

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
    const { user_id, status } = JSON.parse(event.body);

    if (!user_id || !['online', 'offline'].includes(status)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id and status (online/offline) required' }) };
    }

    const result = await sql`
      UPDATE users SET runner_status = ${status} WHERE id = ${user_id} RETURNING id, runner_status
    `;

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, runner_status: result[0].runner_status }) };
  } catch (err) {
    console.error('runner-status-update error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
