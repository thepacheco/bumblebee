import { randomBytes } from 'node:crypto';
import { verifyLinkNonce } from '../lib/ring-auth.mjs';
import {
  database, decryptTokens, prepareTables, ringRequest, SESSION_AGE,
  SESSION_COOKIE, tokenDigest
} from '../lib/ring-server.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') return res.status(405).end();

  const owner = process.env.RING_OWNER_EMAIL?.trim().toLowerCase();
  const signingKey = process.env.RING_HMAC_SIGNING_KEY;
  if (!owner || !signingKey || !process.env.DATABASE_URL || !process.env.RING_CLIENT_SECRET) {
    return res.status(503).send('Kitchen account linking is not configured.');
  }

  const { nonce, time: timestamp } = req.query;
  if (typeof nonce !== 'string' || typeof timestamp !== 'string') return res.status(400).end();

  let step = 'read pending tokens';
  try {
    const sql = database();
    const pending = await sql`SELECT * FROM ring_pending_links
      WHERE received_at > now() - interval '10 minutes'`;
    const entry = pending.find(({ account_id: accountId }) =>
      verifyLinkNonce({ nonce, timestamp, accountId, signingKey }));
    if (!entry) {
      console.warn('Ring link: no matching pending authorization');
      return res.status(403).send('This Ring link expired or was already used.');
    }

    const { account_id: accountId, encrypted_tokens: encrypted } = entry;
    const tokens = decryptTokens(accountId, encrypted);
    step = 'verify owner';
    const profile = await ringRequest('/v1/users/me', tokens.accessToken);
    if (!profile.ok) return res.status(502).end();
    const user = (await profile.json()).data;
    if (user?.id !== accountId || user.attributes?.email?.trim().toLowerCase() !== owner) {
      return res.status(403).send('This Ring account is not authorized for Kitchen.');
    }

    const [local, domain] = owner.split('@');
    const accountIdentifier = `${local[0]}***@${domain}`;
    const integration = '/v1/accounts/me/app-integrations';
    const headers = { 'Content-Type': 'application/json' };
    step = 'activate Ring integration';
    const approved = await ringRequest(integration, tokens.accessToken, {
      method: 'POST', headers, body: JSON.stringify({ nonce, account_identifier: accountIdentifier })
    });
    if (!approved.ok) return res.status(502).send('Ring did not accept the account link.');

    step = 'find Kitchen camera';
    const devices = await ringRequest('/v1/devices', tokens.accessToken);
    if (!devices.ok) return res.status(502).end();
    const matches = (await devices.json()).data.filter(device => {
      const name = device.attributes?.name?.trim().toLowerCase();
      return name === 'kitchen' || name === 'ktichen';
    });
    if (matches.length !== 1) return res.status(409).send('Share only the Kitchen camera when linking.');

    step = 'complete Ring integration';
    const completed = await ringRequest(integration, tokens.accessToken, {
      method: 'PATCH', headers, body: JSON.stringify({ status: 'completed' })
    });
    if (!completed.ok) return res.status(502).end();

    step = 'save browser authorization';
    await prepareTables(sql);
    const viewer = randomBytes(32).toString('base64url');
    const expiresAt = new Date(new Date(entry.received_at).getTime() + tokens.expiresIn * 1000).toISOString();
    const saved = await sql`WITH claimed AS (
      DELETE FROM ring_pending_links WHERE account_id = ${accountId} AND encrypted_tokens = ${encrypted}
      RETURNING account_id
    ), linked AS (
      INSERT INTO ring_kitchen_links (account_id, device_id, encrypted_tokens, expires_at)
      SELECT account_id, ${matches[0].id}, ${encrypted}, ${expiresAt} FROM claimed
      ON CONFLICT (account_id) DO UPDATE SET device_id = EXCLUDED.device_id,
        encrypted_tokens = EXCLUDED.encrypted_tokens, expires_at = EXCLUDED.expires_at
      RETURNING account_id
    )
    INSERT INTO ring_kitchen_viewers (token_hash, account_id, expires_at)
    SELECT ${tokenDigest(viewer)}, account_id, now() + interval '30 days' FROM linked
    RETURNING account_id`;
    if (!saved.length) return res.status(409).send('This Ring link was already used.');

    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${viewer}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_AGE}`);
    console.info('Ring link: browser authorization saved');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kitchen linked</title><main><h1>Kitchen linked</h1><p>This browser is authorized. Open Camera in the Beejan check-in. To use your phone, choose Pair device in the camera panel.</p><p><a href="https://www.beejan.co/">Open Beejan</a></p></main></html>');
  } catch {
    console.error('Ring link failed:', step);
    return res.status(502).send('Could not complete Ring account linking.');
  }
}
