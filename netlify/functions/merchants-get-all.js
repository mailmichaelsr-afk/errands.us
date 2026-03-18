// netlify/functions/merchants-get-all.js

const { neon } = require("@neondatabase/serverless");

exports.handler = async () => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const sql = neon(process.env.DATABASE_URL);
    const merchants = await sql`
      SELECT 
        m.*,
        u.full_name as creator_name,
        u.email as creator_email
      FROM merchants m
      LEFT JOIN users u ON m.created_by = u.id
      ORDER BY m.created_at DESC
    `;
    return { statusCode: 200, headers, body: JSON.stringify(merchants) };
  } catch (err) {
    console.error("merchants-get-all error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
