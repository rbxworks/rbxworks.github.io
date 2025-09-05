// pages/api/save-data.js
import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // We'll get the data from the URL, like: /api/save-data?id=123&user=rob
  const { id, user, value } = request.query;

  // Make sure we have a unique ID
  if (!id) {
    return response.status(400).json({ error: 'An ID is required.' });
  }

  // Save the data to Vercel KV using the ID as the key
  await kv.set(`data:${id}`, { user, value, receivedAt: new Date() });

  // Send a simple success response
  response.status(200).json({ success: true, message: `Data saved for ID: ${id}` });
}
