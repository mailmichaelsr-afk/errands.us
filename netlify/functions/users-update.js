// netlify/functions/users-update.js

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

    if (!data.id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "id is required" }),
      };
    }

    const updates = [];
    const values = [];

    if (data.status !== undefined)                { updates.push(`status = $${updates.length + 1}`);                values.push(data.status); }
    if (data.role !== undefined)                  { updates.push(`role = $${updates.length + 1}`);                  values.push(data.role); }
    if (data.full_name !== undefined)             { updates.push(`full_name = $${updates.length + 1}`);             values.push(data.full_name); }
    if (data.phone !== undefined)                 { updates.push(`phone = $${updates.length + 1}`);                 values.push(data.phone); }
    if (data.street !== undefined)                { updates.push(`street = $${updates.length + 1}`);                values.push(data.street); }
    if (data.city !== undefined)                  { updates.push(`city = $${updates.length + 1}`);                  values.push(data.city); }
    if (data.state !== undefined)                 { updates.push(`state = $${updates.length + 1}`);                 values.push(data.state); }
    if (data.zip !== undefined)                   { updates.push(`zip = $${updates.length + 1}`);                   values.push(data.zip); }
    if (data.delivery_instructions !== undefined) { updates.push(`delivery_instructions = $${updates.length + 1}`); values.push(data.delivery_instructions); }
    if (data.can_add_merchants !== undefined)     { updates.push(`can_add_merchants = $${updates.length + 1}`);     values.push(data.can_add_merchants); }
    if (data.original_role !== undefined)         { updates.push(`original_role = $${updates.length + 1}`);         values.push(data.original_role); }

    if (updates.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No fields to update" }),
      };
    }

    values.push(data.id);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await sql(query, values);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("users-update error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
