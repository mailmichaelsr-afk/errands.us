// netlify/functions/requests-accept.js

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
    const data = JSON.parse(event.body);

    // Accept both runner_id and driver_id
    const runnerId = data.runner_id || data.driver_id;

    if (!data.request_id || !runnerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "request_id and runner_id required" }),
      };
    }

    const result = await sql`
      UPDATE requests
      SET status = 'accepted',
          assigned_to = ${runnerId}
      WHERE id = ${data.request_id}
        AND status = 'open'
      RETURNING *
    `;

    if (result.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Request already accepted or not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("requests-accept error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
