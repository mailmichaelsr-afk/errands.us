// netlify/functions/territory-application-update.js

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
    const { id, status, notes, reviewed_by } = JSON.parse(event.body);

    if (!id || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'id and status are required' })
      };
    }

    const result = await sql`
      UPDATE territory_applications
      SET 
        status = ${status},
        notes = ${notes || null},
        reviewed_by = ${reviewed_by || null},
        reviewed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, application: result[0] })
    };
  } catch (err) {
    console.error('territory-application-update error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
