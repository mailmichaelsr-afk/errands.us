// netlify/functions/territory-applications-get.js

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
    const { status } = event.queryStringParameters || {};

    const applications = status
      ? await sql`
          SELECT 
            ta.*,
            u.full_name, u.email, u.phone, u.street, u.city, u.state, u.zip,
            array_length(ta.desired_slots, 1) as slot_count
          FROM territory_applications ta
          JOIN users u ON ta.user_id = u.id
          WHERE ta.status = ${status}
          ORDER BY ta.created_at DESC
        `
      : await sql`
          SELECT 
            ta.*,
            u.full_name, u.email, u.phone, u.street, u.city, u.state, u.zip,
            array_length(ta.desired_slots, 1) as slot_count
          FROM territory_applications ta
          JOIN users u ON ta.user_id = u.id
          ORDER BY ta.created_at DESC
        `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(applications)
    };
  } catch (err) {
    console.error('territory-applications-get error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
