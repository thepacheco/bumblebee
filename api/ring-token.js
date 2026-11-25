import { createCipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { exchangeRingAuthorizationCode } from '../lib/ring-auth.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !==
      'application/x-www-form-urlencoded') {
    return res.status(415).end();
  }

  const { RING_CLIENT_ID, RING_CLIENT_SECRET, DATABASE_URL } = process.env;
  if (!RING_CLIENT_ID || !RING_CLIENT_SECRET || !DATABASE_URL) return res.status(503).end();

  const body = typeof req.body === 'string'
    ? Object.fromEntries(new URLSearchParams(req.body))
    : req.body;
  if (body?.client_id !== RING_CLIENT_ID || typeof body.code !== 'string' || !body.code) {
    return res.status(400).end();
  }

  try {
    const tokens = await exchangeRingAuthorizationCode(body.code);
    const profile = await fetch('https://api.amazonvision.com/v1/users/me', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
      redirect: 'error',
      signal: AbortSignal.timeout(8000)
    });
    if (!profile.ok) return res.status(502).end();
    const accountId = (await profile.json()).data?.id;
    if (typeof accountId !== 'string' || !accountId) return res.status(502).end();

    const key = hkdfSync('sha256', RING_CLIENT_SECRET, 'beejan', 'ring-pending-tokens-v1', 32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(accountId));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(tokens), 'utf8'), cipher.final()]);
    const encrypted = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');

    const sql = neon(DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS ring_pending_links (
      account_id text PRIMARY KEY,
      encrypted_tokens text NOT NULL,
      received_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`INSERT INTO ring_pending_links (account_id, encrypted_tokens)
      VALUES (${accountId}, ${encrypted})
      ON CONFLICT (account_id) DO UPDATE
      SET encrypted_tokens = EXCLUDED.encrypted_tokens, received_at = now()`;

    return res.status(200).end();
  } catch {
    return res.status(502).end();
  }
}
