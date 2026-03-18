// netlify/functions/territories-update.js

const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'id is required' }) };
    }

    const updates = [];
    const values = [];

    if (data.name !== undefined)        { updates.push(`name = $${updates.length + 1}`);        values.push(data.name); }
    if (data.zip_codes !== undefined)   { updates.push(`zip_codes = $${updates.length + 1}`);   values.push(data.zip_codes); }
    if (data.price !== undefined)       { updates.push(`price = $${updates.length + 1}`);       values.push(data.price); }
    if (data.status !== undefined)      { updates.push(`status = $${updates.length + 1}`);      values.push(data.status); }
    if (data.time_slots !== undefined)  { updates.push(`time_slots = $${updates.length + 1}`);  values.push(data.time_slots); }
    if (data.owner_id !== undefined)    { updates.push(`owner_id = $${updates.length + 1}`);    values.push(data.owner_id); }

    if (updates.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) };
    }

    values.push(data.id);
    const query = `UPDATE territories SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await sql(query, values);

    return { statusCode: 200, headers, body: JSON.stringify(result[0]) };
  } catch (err) {
    console.error('territories-update error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
