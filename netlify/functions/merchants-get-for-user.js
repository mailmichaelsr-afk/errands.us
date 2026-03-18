// netlify/functions/merchants-get-for-user.js

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
    const { user_id, zip } = event.queryStringParameters || {};

    if (!user_id || !zip) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "user_id and zip required" }) };
    }

    const merchants = await sql`
      SELECT DISTINCT m.*
      FROM merchants m
      WHERE m.status = 'approved'
        AND m.id NOT IN (
          SELECT merchant_id FROM hidden_merchants WHERE user_id = ${user_id}
        )
        AND (
          (m.zip = ${zip} AND m.is_personal = false)
          OR m.created_by = ${user_id}
        )
      ORDER BY m.name ASC
    `;

    return { statusCode: 200, headers, body: JSON.stringify(merchants) };
  } catch (err) {
    console.error("merchants-get-for-user error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
