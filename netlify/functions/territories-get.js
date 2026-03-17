// netlify/functions/territories-get.js

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
    const { zip } = event.queryStringParameters || {};

    // If ZIP provided, return matching territories
    if (zip) {
      const rows = await sql`
        SELECT 
          t.*,
          u.full_name as owner_name,
          u.email as owner_email
        FROM territories t
        LEFT JOIN users u ON t.owner_id = u.id
        WHERE ${zip} = ANY(t.zip_codes)
        ORDER BY t.name ASC
      `;
      return { statusCode: 200, headers, body: JSON.stringify(rows) };
    }

    // No ZIP — return all territories
    const rows = await sql`
      SELECT 
        t.*,
        u.full_name as owner_name,
        u.email as owner_email
      FROM territories t
      LEFT JOIN users u ON t.owner_id = u.id
      ORDER BY 
        CASE t.status
          WHEN 'available' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'sold' THEN 3
        END,
        t.name ASC
    `;

    return { statusCode: 200, headers, body: JSON.stringify(rows) };
  } catch (err) {
    console.error("territories-get error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
