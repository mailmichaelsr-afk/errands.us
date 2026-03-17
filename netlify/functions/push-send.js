// netlify/functions/push-send.js
// Internal function called by requests-create.js to fire push notifications
// Uses web-push library

const { neon } = require('@neondatabase/serverless');
const webpush = require('web-push');

// VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.NETLIFY_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.NETLIFY_VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:admin@errands.us',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

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
    const { userIds, title, body, url } = JSON.parse(event.body);

    if (!userIds || !userIds.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ sent: 0 }) };
    }

    const sql = neon(process.env.DATABASE_URL);

    // Get all push subscriptions for the target users
    const subscriptions = await sql`
      SELECT * FROM push_subscriptions
      WHERE user_id = ANY(${userIds})
    `;

    if (!subscriptions.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, message: 'No subscriptions found' }) };
    }

    const payload = JSON.stringify({ title, body, url });

    // Send to all subscriptions, collect failures
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };
        return webpush.sendNotification(pushSubscription, payload);
      })
    );

    // Clean up expired subscriptions (410 Gone)
    const expiredEndpoints = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected' && result.reason?.statusCode === 410) {
        expiredEndpoints.push(subscriptions[i].endpoint);
      }
    });

    if (expiredEndpoints.length > 0) {
      await sql`
        DELETE FROM push_subscriptions
        WHERE endpoint = ANY(${expiredEndpoints})
      `;
    }

    const sent = results.filter(r => r.status === 'fulfilled').length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sent, total: subscriptions.length })
    };
  } catch (err) {
    console.error('push-send error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
