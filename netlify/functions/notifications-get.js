// netlify/functions/notifications-get.js
// Lightweight endpoint - checks for anything new since a timestamp
// Used by the in-app notification bell as polling fallback

const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { userId, role, since, zip } = event.queryStringParameters || {};

    if (!userId || !role) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userId or role' }) };
    }

    const sql = neon(process.env.DATABASE_URL);
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 60000); // default: last 60 seconds
    const notifications = [];

    if (role === 'runner') {
      // New open requests (unassigned, created after sinceDate)
      const newRequests = await sql`
        SELECT id, title, delivery_zip, created_at, offered_amount
        FROM requests
        WHERE assigned_to IS NULL
        AND status = 'open'
        AND created_at > ${sinceDate}
        ORDER BY created_at DESC
        LIMIT 10
      `;

      for (const r of newRequests) {
        notifications.push({
          id: `req-${r.id}`,
          type: 'new_request',
          title: 'New Job Available',
          body: `${r.title}${r.offered_amount ? ` — $${r.offered_amount}` : ''}`,
          url: '/',
          created_at: r.created_at
        });
      }

      // New messages on their active jobs
      const newMessages = await sql`
        SELECT m.id, m.message, m.created_at, m.request_id, r.title
        FROM messages m
        JOIN requests r ON r.id = m.request_id
        WHERE r.assigned_to = ${userId}
        AND m.sender_id != ${userId}
        AND m.created_at > ${sinceDate}
        ORDER BY m.created_at DESC
        LIMIT 10
      `;

      for (const m of newMessages) {
        notifications.push({
          id: `msg-${m.id}`,
          type: 'new_message',
          title: 'New Message',
          body: `Re: ${m.title}`,
          url: `/request/${m.request_id}`,
          created_at: m.created_at
        });
      }
    }

    if (role === 'owner') {
      // New requests assigned to them
      const newAssigned = await sql`
        SELECT id, title, created_at, offered_amount
        FROM requests
        WHERE assigned_to = ${userId}
        AND status = 'open'
        AND created_at > ${sinceDate}
        ORDER BY created_at DESC
        LIMIT 10
      `;

      for (const r of newAssigned) {
        notifications.push({
          id: `req-${r.id}`,
          type: 'new_request',
          title: 'New Request In Your Territory',
          body: `${r.title}${r.offered_amount ? ` — $${r.offered_amount}` : ''}`,
          url: '/owner',
          created_at: r.created_at
        });
      }

      // New messages
      const newMessages = await sql`
        SELECT m.id, m.message, m.created_at, m.request_id, r.title
        FROM messages m
        JOIN requests r ON r.id = m.request_id
        WHERE r.assigned_to = ${userId}
        AND m.sender_id != ${userId}
        AND m.created_at > ${sinceDate}
        ORDER BY m.created_at DESC
        LIMIT 10
      `;

      for (const m of newMessages) {
        notifications.push({
          id: `msg-${m.id}`,
          type: 'new_message',
          title: 'New Message',
          body: `Re: ${m.title}`,
          url: `/request/${m.request_id}`,
          created_at: m.created_at
        });
      }
    }

    if (role === 'customer') {
      // Their request was accepted
      const accepted = await sql`
        SELECT id, title, created_at
        FROM requests
        WHERE customer_id = ${userId}
        AND status = 'accepted'
        AND created_at > ${sinceDate}
        ORDER BY created_at DESC
        LIMIT 10
      `;

      for (const r of accepted) {
        notifications.push({
          id: `acc-${r.id}`,
          type: 'request_accepted',
          title: 'Your Request Was Accepted!',
          body: r.title,
          url: `/request/${r.id}`,
          created_at: r.created_at
        });
      }

      // New messages on their requests
      const newMessages = await sql`
        SELECT m.id, m.message, m.created_at, m.request_id, r.title
        FROM messages m
        JOIN requests r ON r.id = m.request_id
        WHERE r.customer_id = ${userId}
        AND m.sender_id != ${userId}
        AND m.created_at > ${sinceDate}
        ORDER BY m.created_at DESC
        LIMIT 10
      `;

      for (const m of newMessages) {
        notifications.push({
          id: `msg-${m.id}`,
          type: 'new_message',
          title: 'New Message',
          body: `Re: ${m.title}`,
          url: `/request/${m.request_id}`,
          created_at: m.created_at
        });
      }
    }

    // Sort by newest first
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        notifications,
        count: notifications.length,
        checkedAt: new Date().toISOString()
      })
    };
  } catch (err) {
    console.error('notifications-get error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
