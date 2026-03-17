// netlify/functions/users-get-by-email.js

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
    const email = event.queryStringParameters?.email;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "email is required" }),
      };
    }

    const result = await sql`
      SELECT 
        id, email, full_name, name, role, status, phone, avatar_url,
        street, city, state, zip, delivery_instructions,
        can_add_merchants, original_role, netlify_id, created_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("users-get-by-email error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
