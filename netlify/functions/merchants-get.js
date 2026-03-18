// netlify/functions/merchants-get.js

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
    const { category } = event.queryStringParameters || {};

    const rows = category
      ? await sql`SELECT * FROM merchants WHERE status = 'approved' AND category = ${category} ORDER BY name ASC`
      : await sql`SELECT * FROM merchants WHERE status = 'approved' ORDER BY category ASC, name ASC`;

    return { statusCode: 200, headers, body: JSON.stringify(rows) };
  } catch (err) {
    console.error("merchants-get error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
