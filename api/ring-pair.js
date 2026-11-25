import { randomBytes, timingSafeEqual } from 'node:crypto';
import { database, decryptTokens, ringRequest, prepareTables, SESSION_COOKIE, SESSION_AGE, tokenDigest } from '../lib/ring-server.mjs';

const SITE = 'https://www.beejan.co';
const TOKEN = /^[\w-]{43}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.origin !== SITE) return res.status(403).end();

  const recovery = req.body?.recovery;
  if (recovery !== undefined) {
    const expected = process.env.RING_BROWSER_RECOVERY_KEY;
    if (typeof expected !== 'string' || !expected || expected.length > 128) {
      console.warn('Ring recovery: production secret missing or exceeds maximum length');
      return res.status(503).json({ error: 'recovery_configuration' });
    }
    if (typeof recovery !== 'string' || recovery.length > 128 ||
        !timingSafeEqual(Buffer.from(tokenDigest(recovery), 'hex'), Buffer.from(tokenDigest(expected), 'hex'))) {
      return res.status(403).end();
    }
  }

  try {
    const sql = database();
    await prepareTables(sql);
    await sql`CREATE TABLE IF NOT EXISTS ring_kitchen_pairing (
      token_hash text PRIMARY KEY,
      account_id text NOT NULL REFERENCES ring_kitchen_links(account_id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    )`;
    const viewer = randomBytes(32).toString('base64url');
    if (recovery !== undefined) {
      const existing = await sql`SELECT account_id FROM ring_kitchen_links LIMIT 2`;
      if (existing.length === 0) {
        const owner = process.env.RING_OWNER_EMAIL?.trim().toLowerCase();
        if (!owner) return res.status(503).json({ error: 'owner_configuration' });
        const [table] = await sql`SELECT to_regclass('ring_pending_links') AS pending`;
        if (!table.pending) return res.status(409).json({ error: 'no_ring_grant' });
        const pending = await sql`SELECT * FROM ring_pending_links ORDER BY received_at DESC LIMIT 10`;
        let reason = 'no_ring_grant';
        for (const entry of pending) {
          const tokens = decryptTokens(entry.account_id, entry.encrypted_tokens);
          const profile = await ringRequest('/v1/users/me', tokens.accessToken);
          if (!profile.ok) { reason = 'ring_grant_unavailable'; continue; }
          const user = (await profile.json()).data;
          if (user?.id !== entry.account_id || user.attributes?.email?.trim().toLowerCase() !== owner) {
            reason = 'ring_owner_mismatch';
            continue;
          }
          const devices = await ringRequest('/v1/devices', tokens.accessToken);
          if (!devices.ok) { reason = 'ring_device_permission'; break; }
          const cameras = (await devices.json()).data.filter(device =>
            /^(kitchen|ktichen)$/i.test(device.attributes?.name?.trim() || ''));
          if (cameras.length !== 1) { reason = 'ring_kitchen_missing'; break; }
          const confirmed = await ringRequest('/v1/accounts/me/app-integrations', tokens.accessToken, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
          });
          if (!confirmed.ok) { reason = 'ring_link_pending'; break; }
          const expires = new Date(new Date(entry.received_at).getTime() + 1000 * tokens.expiresIn).toISOString();
          await sql`WITH claimed AS (DELETE FROM ring_pending_links
            WHERE account_id = ${entry.account_id} AND encrypted_tokens = ${entry.encrypted_tokens}
            RETURNING account_id, encrypted_tokens)
            INSERT INTO ring_kitchen_links (account_id, device_id, encrypted_tokens, expires_at)
            SELECT account_id, ${cameras[0].id}, encrypted_tokens, ${expires} FROM claimed
            ON CONFLICT (account_id) DO NOTHING`;
          break;
        }
        const linked = await sql`SELECT account_id FROM ring_kitchen_links LIMIT 1`;
        if (!linked.length) return res.status(409).json({ error: reason });
      }
      const rows = await sql`WITH sole_link AS (
        SELECT min(account_id) AS account_id FROM ring_kitchen_links HAVING count(*) = 1
      )
      INSERT INTO ring_kitchen_viewers (token_hash, account_id, expires_at)
        SELECT ${tokenDigest(viewer)}, account_id, now() + interval '30 days' FROM sole_link
        RETURNING account_id`;
      if (!rows.length) return res.status(409).json({ error: 'multiple_links' });
      res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${viewer}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_AGE}`);
      return res.status(204).end();
    }
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
  } catch (error) {
    console.error('Ring pairing: storage operation failed', error?.code ?? 'unknown');
    return res.status(503).json({ error: 'recovery_storage' });
  }
}
