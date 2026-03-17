// netlify/functions/requests-get.js

const { neon } = require("@neondatabase/serverless");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const requests = await sql`
      SELECT 
        r.*,
        c.full_name as customer_name,
        c.email as customer_email,
        u.full_name as runner_name,
        u.email as runner_email
      FROM requests r
      LEFT JOIN users c ON r.customer_id = c.id
      LEFT JOIN users u ON r.assigned_to = u.id
      ORDER BY r.created_at DESC
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(requests),
    };
  } catch (err) {
    console.error("requests-get error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
