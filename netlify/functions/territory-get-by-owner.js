// netlify/functions/territory-get-by-owner.js

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
    const { owner_id } = event.queryStringParameters || {};

    if (!owner_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "owner_id is required" }),
      };
    }

    const result = await sql`
      SELECT *
      FROM territories
      WHERE owner_id = ${parseInt(owner_id)}
      LIMIT 1
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result[0] || null),
    };
  } catch (err) {
    console.error("territory-get-by-owner error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
