// netlify/functions/merchants-update.js

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
        body: JSON.stringify({ error: "Merchant ID is required" }),
      };
    }

    const updates = [];
    const values = [];

    if (data.name !== undefined)     { updates.push(`name = $${updates.length + 1}`);     values.push(data.name); }
    if (data.category !== undefined) { updates.push(`category = $${updates.length + 1}`); values.push(data.category); }
    if (data.address !== undefined)  { updates.push(`address = $${updates.length + 1}`);  values.push(data.address || null); }
    if (data.phone !== undefined)    { updates.push(`phone = $${updates.length + 1}`);    values.push(data.phone || null); }
    if (data.hours !== undefined)    { updates.push(`hours = $${updates.length + 1}`);    values.push(data.hours || null); }
    if (data.website !== undefined)  { updates.push(`website = $${updates.length + 1}`);  values.push(data.website || null); }
    if (data.status !== undefined)   { updates.push(`status = $${updates.length + 1}`);   values.push(data.status); }

    if (updates.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No fields to update" }),
      };
    }

    values.push(data.id);
    const query = `UPDATE merchants SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await sql(query, values);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result[0]),
    };
  } catch (err) {
    console.error("merchants-update error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
