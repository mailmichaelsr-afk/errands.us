// netlify/functions/runners-online-get.js

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
    const { zip } = event.queryStringParameters || {};

    const runners = zip
      ? await sql`
          SELECT id, full_name, phone, zip, service_zip, runner_status
          FROM users
          WHERE role IN ('runner', 'independent_driver', 'territory_owner')
            AND status = 'active'
            AND runner_status = 'online'
            AND (zip = ${zip} OR service_zip = ${zip})
          ORDER BY full_name ASC
        `
      : await sql`
          SELECT id, full_name, phone, zip, service_zip, runner_status
          FROM users
          WHERE role IN ('runner', 'independent_driver', 'territory_owner')
            AND status = 'active'
            AND runner_status = 'online'
          ORDER BY full_name ASC
        `;

    return { statusCode: 200, headers, body: JSON.stringify(runners) };
  } catch (err) {
    console.error('runners-online-get error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
