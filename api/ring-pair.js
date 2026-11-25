import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  database, FAMILY_KEY_HASH, prepareTables, SESSION_AGE, SESSION_COOKIE, tokenDigest
} from '../lib/ring-server.mjs';

const SITE = 'https://www.beejan.co';
const TOKEN = /^[\w-]{43}$/;

// Redeems the family link (https://www.beejan.co/#kitchen=<secret>) and
// authorizes this browser to view the Kitchen camera.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.origin !== SITE) return res.status(403).end();

  const family = req.body?.family;
  if (typeof family !== 'string' || !TOKEN.test(family) ||
      !timingSafeEqual(Buffer.from(tokenDigest(family), 'hex'), Buffer.from(FAMILY_KEY_HASH, 'hex'))) {
    return res.status(403).end();
  }

  try {
    const sql = database();
    await prepareTables(sql);
    const viewer = randomBytes(32).toString('base64url');
    const rows = await sql`WITH sole_link AS (
      SELECT min(account_id) AS account_id FROM ring_kitchen_links HAVING count(*) = 1
    )
    INSERT INTO ring_kitchen_viewers (token_hash, account_id, expires_at, family_hash)
      SELECT ${tokenDigest(viewer)}, account_id, now() + interval '30 days', ${FAMILY_KEY_HASH} FROM sole_link
      RETURNING account_id`;
    if (!rows.length) {
      console.warn('Ring family link: no single linked Ring account');
      return res.status(409).end();
    }
    console.info('Ring family link: browser authorized');
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${viewer}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_AGE}`);
    return res.status(204).end();
  } catch (error) {
    console.error('Ring family link: storage operation failed', error?.code ?? 'unknown');
    return res.status(503).end();
  }
}
