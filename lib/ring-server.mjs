import { createDecipheriv, createCipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export const API_ORIGIN = 'https://api.amazonvision.com';
export const SESSION_COOKIE = '__Host-beejan-kitchen';
export const SESSION_AGE = 30 * 24 * 60 * 60;

export function database() {
  return neon(process.env.DATABASE_URL);
}

function encryptionKey() {
  return hkdfSync('sha256', process.env.RING_CLIENT_SECRET, 'beejan', 'ring-pending-tokens-v1', 32);
}

export function decryptTokens(accountId, encoded) {
  const bytes = Buffer.from(encoded, 'base64url');
  const cipher = createDecipheriv('aes-256-gcm', encryptionKey(), bytes.subarray(0, 12));
  cipher.setAAD(Buffer.from(accountId));
  cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]));
}

export function encryptTokens(accountId, tokens) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(Buffer.from(accountId));
  const contents = Buffer.concat([cipher.update(JSON.stringify(tokens)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), contents]).toString('base64url');
}

export function tokenDigest(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function ringRequest(path, token, options = {}) {
  const response = await fetch(new URL(path, API_ORIGIN), {
    ...options,
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${token}`, ...options.headers }
  });
  return response;
}

export async function readBody(req, maximum = 65536) {
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    const bytes = Buffer.from(req.body);
    if (bytes.length > maximum) throw new RangeError('Request too large');
    return bytes;
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > maximum) throw new RangeError('Request too large');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function prepareTables(sql) {
  await sql`CREATE TABLE IF NOT EXISTS ring_kitchen_links (
    account_id text PRIMARY KEY,
    device_id text NOT NULL,
    encrypted_tokens text NOT NULL,
    expires_at timestamptz NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ring_kitchen_viewers (
    token_hash text PRIMARY KEY,
    account_id text NOT NULL REFERENCES ring_kitchen_links(account_id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL
  )`;
}

export async function prepareCameraStatus(sql) {
  await prepareTables(sql);
  await sql`CREATE TABLE IF NOT EXISTS ring_kitchen_offline (
    account_id text NOT NULL REFERENCES ring_kitchen_links(account_id) ON DELETE CASCADE,
    device_id text NOT NULL,
    offline_at timestamptz NOT NULL,
    PRIMARY KEY (account_id, device_id)
  )`;
}
