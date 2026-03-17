// netlify/functions/push-subscribe.js
// Saves a user's push subscription to the database

const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { userId, subscription } = JSON.parse(event.body);

    if (!userId || !subscription) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userId or subscription' }) };
    }

    const sql = neon(process.env.DATABASE_URL);

    // Create push_subscriptions table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, endpoint)
      )
    `;

    // Upsert subscription (update if endpoint already exists for user)
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (
        ${userId},
        ${subscription.endpoint},
        ${subscription.keys.p256dh},
        ${subscription.keys.auth}
      )
      ON CONFLICT (user_id, endpoint)
      DO UPDATE SET
        p256dh = ${subscription.keys.p256dh},
        auth = ${subscription.keys.auth},
        created_at = NOW()
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('push-subscribe error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
