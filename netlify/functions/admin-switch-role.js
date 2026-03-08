// netlify/functions/admin-switch-role.js
// Allows admin to temporarily switch roles for testing

import { neon } from "@neondatabase/serverless";

export const config = { runtime: "nodejs" };

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = JSON.parse(event.body);

    if (!data.user_id || !data.new_role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "user_id and new_role required" }),
      };
    }

    // Verify user is admin before allowing switch
    const user = await sql`
      SELECT role FROM users WHERE id = ${data.user_id}
    `;

    if (!user.length || user[0].role !== 'admin') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Only admins can switch roles" }),
      };
    }

    // Store original role if this is first switch
    const hasOriginal = await sql`
      SELECT original_role FROM users WHERE id = ${data.user_id}
    `;

    if (!hasOriginal[0]?.original_role) {
      await sql`
        UPDATE users 
        SET original_role = 'admin'
        WHERE id = ${data.user_id}
      `;
    }

    // Update role
    await sql`
      UPDATE users
      SET role = ${data.new_role}
      WHERE id = ${data.user_id}
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, new_role: data.new_role }),
    };
  } catch (err) {
    console.error("admin-switch-role error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
