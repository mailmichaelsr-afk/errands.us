// netlify/functions/territory-application-create.js

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
    const { user_id, desired_zip, desired_slots, business_name, why } = JSON.parse(event.body);

    if (!user_id || !desired_zip) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'user_id and desired_zip are required' })
      };
    }

    const result = await sql`
      INSERT INTO territory_applications (
        user_id, desired_zip, desired_slots, business_name, why, status
      ) VALUES (
        ${user_id},
        ${desired_zip},
        ${desired_slots || []},
        ${business_name || null},
        ${why || null},
        'pending'
      )
      RETURNING *
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, application: result[0] })
    };
  } catch (err) {
    console.error('territory-application-create error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
