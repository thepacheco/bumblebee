import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_ENDPOINT = 'https://oauth.ring.com/oauth/token';
const NONCE_LIFETIME_MS = 10 * 60 * 1000;

export function verifyLinkNonce({ nonce, timestamp, accountId, signingKey, now = Date.now() }) {
  if (!/^\d{13}$/.test(timestamp) || !/^[\w-]{43}$/.test(nonce) || !accountId || !signingKey) {
    return false;
  }

  const age = now - Number(timestamp);
  if (age < 0 || age > NONCE_LIFETIME_MS) return false;

  const expected = createHmac('sha256', signingKey)
    .update(`${timestamp}:${accountId}`)
    .digest('base64url');
  const received = Buffer.from(nonce, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');

  return received.length === expectedBytes.length && timingSafeEqual(received, expectedBytes);
}

export async function exchangeRingAuthorizationCode(code, {
  clientId = process.env.RING_CLIENT_ID,
  clientSecret = process.env.RING_CLIENT_SECRET,
  request = fetch
} = {}) {
  if (!code || !clientId || !clientSecret) throw new Error('Ring token exchange is not configured');

  const response = await request(TOKEN_ENDPOINT, {
    method: 'POST',
    redirect: 'error',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code
    }),
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) throw new Error(`Ring token exchange failed (HTTP ${response.status})`);

  const { access_token, refresh_token, expires_in } = await response.json();
  if (typeof access_token !== 'string' || !access_token ||
      typeof refresh_token !== 'string' || !refresh_token ||
      typeof expires_in !== 'number' || !Number.isFinite(expires_in) || expires_in <= 0) {
    throw new Error('Ring returned an invalid token response');
  }

  return { accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in };
}
