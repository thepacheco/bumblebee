import { createHmac, timingSafeEqual } from 'node:crypto';
import { database, prepareCameraStatus, prepareTables, readBody } from '../lib/ring-server.mjs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const signingKey = process.env.RING_HMAC_SIGNING_KEY;
  if (!signingKey || !process.env.DATABASE_URL) return res.status(503).end();

  const signature = req.headers['x-signature'];
  if (typeof signature !== 'string' || !/^sha256=[a-f0-9]{64}$/.test(signature)) {
    return res.status(401).end();
  }

  try {
    const raw = await readBody(req);
    const expected = createHmac('sha256', signingKey).update(raw).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))) return res.status(401).end();
    const event = JSON.parse(raw);
    const account = event.meta?.account_id;
    const source = event.data?.attributes?.source;
    const sql = database();
    const timestamp = event.data?.attributes?.timestamp;
    if (account && source && event.data?.type === 'device_offline' &&
        Number.isSafeInteger(timestamp) && timestamp > 0 && timestamp <= Date.now() + 60000) {
      await prepareCameraStatus(sql);
      await sql`INSERT INTO ring_kitchen_offline (account_id, device_id, offline_at)
        SELECT account_id, device_id, ${new Date(timestamp).toISOString()} FROM ring_kitchen_links
        WHERE account_id = ${account} AND device_id = ${source}
        ON CONFLICT (account_id, device_id) DO UPDATE
        SET offline_at = greatest(ring_kitchen_offline.offline_at, EXCLUDED.offline_at)`;
    } else if (account && event.data?.type === 'app_integration_removed') {
      await prepareTables(sql);
      await sql`DELETE FROM ring_kitchen_links WHERE account_id = ${account}`;
    } else if (account && source && event.data?.type === 'device_removed') {
      await prepareTables(sql);
      await sql`DELETE FROM ring_kitchen_links WHERE account_id = ${account} AND device_id = ${source}`;
    }
    return res.status(200).end();
  } catch (error) {
    if (error instanceof RangeError) return res.status(413).end();
    if (error instanceof SyntaxError) return res.status(400).end();
    return res.status(502).end();
  }
}
