// netlify/functions/merchants-moderate.js

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
    const { id, status } = JSON.parse(event.body);

    if (!id || !status) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "id and status are required" }) };
    }

    const result = await sql`
      UPDATE merchants SET status = ${status} WHERE id = ${id} RETURNING *
    `;

    return { statusCode: 200, headers, body: JSON.stringify(result[0]) };
  } catch (err) {
    console.error("merchants-moderate error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
