// netlify/functions/admin-switch-role.js

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

    if (!data.user_id || !data.new_role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "user_id and new_role required" }),
      };
    }

    // Get current user
    const user = await sql`
      SELECT role, original_role FROM users WHERE id = ${data.user_id}
    `;

    if (!user.length) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    // Allow switch if current role is admin OR original_role is admin
    const isAdmin = user[0].role === 'admin' || user[0].original_role === 'admin';
    if (!isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Only admins can switch roles" }),
      };
    }

    // Store original role if not already stored
    if (!user[0].original_role) {
      await sql`
        UPDATE users SET original_role = ${user[0].role} WHERE id = ${data.user_id}
      `;
    }

    // Update role
    await sql`
      UPDATE users SET role = ${data.new_role} WHERE id = ${data.user_id}
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, new_role: data.new_role }),
    };
  } catch (err) {
    console.error("admin-switch-role error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
