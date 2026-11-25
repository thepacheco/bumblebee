import { randomBytes } from 'node:crypto';
import { database, SESSION_COOKIE, SESSION_AGE, tokenDigest } from '../lib/ring-server.mjs';

const SITE = 'https://www.beejan.co';
const TOKEN = /^[\w-]{43}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.origin !== SITE) return res.status(403).end();

  try {
    const sql = database();
    await sql`CREATE TABLE IF NOT EXISTS ring_kitchen_pairing (
      token_hash text PRIMARY KEY,
      account_id text NOT NULL REFERENCES ring_kitchen_links(account_id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    )`;
    const viewer = randomBytes(32).toString('base64url');
    if (req.body?.code !== undefined) {
      const { code } = req.body;
      if (typeof code !== 'string' || !TOKEN.test(code)) return res.status(400).end();
      const rows = await sql`WITH claimed AS (
        DELETE FROM ring_kitchen_pairing WHERE token_hash = ${tokenDigest(code)}
          AND expires_at > now() RETURNING account_id
      )
      INSERT INTO ring_kitchen_viewers (token_hash, account_id, expires_at)
        SELECT ${tokenDigest(viewer)}, account_id, now() + interval '30 days' FROM claimed
        RETURNING account_id`;
      if (!rows.length) return res.status(410).end();
      res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${viewer}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_AGE}`);
      return res.status(204).end();
    }

    const cookie = req.cookies?.[SESSION_COOKIE] ?? req.headers.cookie?.split(';')
      .map(part => part.trim()).find(part => part.startsWith(SESSION_COOKIE + '='))
      ?.slice(SESSION_COOKIE.length + 1);
    if (typeof cookie !== 'string' || !TOKEN.test(cookie)) return res.status(401).end();
    const rows = await sql`INSERT INTO ring_kitchen_pairing (token_hash, account_id, expires_at)
      SELECT ${tokenDigest(viewer)}, account_id, now() + interval '5 minutes'
      FROM ring_kitchen_viewers WHERE token_hash = ${tokenDigest(cookie)} AND expires_at > now()
      RETURNING token_hash`;
    if (!rows.length) return res.status(401).end();
    return res.status(200).json({ url: `${SITE}/#camera-pair=${viewer}` });
  } catch {
    console.error('Ring pairing: could not process browser authorization');
    return res.status(503).end();
  }
}
