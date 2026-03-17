// netlify/functions/users-get.js

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
    const { id, netlify_id } = event.queryStringParameters || {};

    // Single user lookup
    if (id || netlify_id) {
      let rows;
      if (id) {
        rows = await sql`
          SELECT 
            id, email, full_name, name, phone, role, status,
            avatar_url, created_at, last_login,
            street, city, state, zip, delivery_instructions,
            can_add_merchants, original_role, netlify_id
          FROM users
          WHERE id = ${parseInt(id)}
          LIMIT 1
        `;
      } else {
        rows = await sql`
          SELECT 
            id, email, full_name, name, phone, role, status,
            avatar_url, created_at, last_login,
            street, city, state, zip, delivery_instructions,
            can_add_merchants, original_role, netlify_id
          FROM users
          WHERE netlify_id = ${netlify_id}
          LIMIT 1
        `;
      }

      if (rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "User not found" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(rows[0]),
      };
    }

    // No ID provided — return all users (admin use)
    const rows = await sql`
      SELECT 
        id, email, full_name, name, phone, role, status,
        avatar_url, created_at, last_login,
        street, city, state, zip,
        can_add_merchants, netlify_id
      FROM users
      ORDER BY 
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'territory_owner' THEN 2
          WHEN 'runner' THEN 3
          WHEN 'customer' THEN 4
          ELSE 5
        END,
        created_at DESC
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(rows),
    };
  } catch (err) {
    console.error("users-get error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
