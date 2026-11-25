import {
  API_ORIGIN, database, decryptTokens, encryptTokens, FAMILY_KEY_HASH, prepareTables, ROSE_ACCESS_TAG, ROSE_OPEN_ACCESS, readBody, ringRequest, prepareCameraStatus, SESSION_AGE, SESSION_COOKIE, tokenDigest
} from '../lib/ring-server.mjs';

async function currentAccessToken(sql, link) {
  const tokens = decryptTokens(link.account_id, link.encrypted_tokens);
  if (new Date(link.expires_at).getTime() > Date.now() + 30_000) return tokens.accessToken;

  const [lease] = await sql`UPDATE ring_kitchen_links
    SET expires_at = now() + interval '20 seconds'
    WHERE account_id = ${link.account_id} AND encrypted_tokens = ${link.encrypted_tokens}
      AND expires_at < now()
    RETURNING account_id`;
  if (!lease) return null;

  try {
    const response = await fetch('https://oauth.ring.com/oauth/token', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
      body: new URLSearchParams({
        grant_type: 'refresh_token', refresh_token: tokens.refreshToken,
        client_id: process.env.RING_CLIENT_ID, client_secret: process.env.RING_CLIENT_SECRET
      })
    });
    if (!response.ok) return null;
    const { access_token, refresh_token, expires_in } = await response.json();
    if (!access_token || !refresh_token || !Number.isFinite(expires_in) || expires_in <= 60) return null;

    const refreshed = encryptTokens(link.account_id, {
      accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in
    });
    const rows = await sql`UPDATE ring_kitchen_links SET encrypted_tokens = ${refreshed},
      expires_at = now() + ${expires_in} * interval '1 second'
      WHERE account_id = ${link.account_id} AND encrypted_tokens = ${link.encrypted_tokens}
      RETURNING account_id`;
    return rows.length ? access_token : null;
  } catch {
    return null;
  }
}

let tablesReady;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Permissions-Policy', 'microphone=(), camera=()');
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) return res.status(405).end();
  if (req.method !== 'GET' && !['https://www.beejan.co', 'https://beejan.co'].includes(req.headers.origin)) return res.status(403).end();

  const rawCookie = req.headers.cookie?.split(';').map(part => part.trim())
    .find(part => part.startsWith(SESSION_COOKIE + '='))?.slice(SESSION_COOKIE.length + 1);
  const cookie = req.cookies?.[SESSION_COOKIE] ?? rawCookie;
  if (typeof cookie !== 'string' || !/^[\w-]{43}$/.test(cookie)) {
    console.info('Ring stream: browser authorization cookie missing');
    return res.status(401).end();
  }

  try {
    const sql = database();
    tablesReady ??= prepareTables(sql).catch(error => { tablesReady = undefined; throw error; });
    await tablesReady;
    const [link] = await sql`SELECT l.*, v.expires_at AS viewer_expires_at FROM ring_kitchen_links l
      JOIN ring_kitchen_viewers v ON v.account_id = l.account_id
      WHERE v.token_hash = ${tokenDigest(cookie)} AND v.expires_at > now()
        AND (v.family_hash IS NULL OR v.family_hash = ${FAMILY_KEY_HASH}
          OR (${ROSE_OPEN_ACCESS} AND v.family_hash = ${ROSE_ACCESS_TAG}))`;
    if (!link) {
      console.info('Ring stream: browser authorization expired or revoked');
      return res.status(401).end();
    }

    if (req.method === 'GET' && req.query?.status === '1') {
      if (new Date(link.viewer_expires_at).getTime() - Date.now() < 7 * 86400000) {
        const renewed = await sql`UPDATE ring_kitchen_viewers
          SET expires_at = now() + interval '30 days'
          WHERE token_hash = ${tokenDigest(cookie)} AND expires_at > now()
          RETURNING token_hash`;
        if (renewed.length) res.setHeader('Set-Cookie',
          `${SESSION_COOKIE}=${cookie}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_AGE}`);
      }
      await prepareCameraStatus(sql);
      const [offline] = await sql`SELECT offline_at FROM ring_kitchen_offline
        WHERE account_id = ${link.account_id} AND device_id = ${link.device_id}`;
      const token = await currentAccessToken(sql, link);
      let online = null;
      if (token) {
        const response = await ringRequest(`/v1/devices/${encodeURIComponent(link.device_id)}/status`, token);
        if (response.ok) online = (await response.json()).data?.attributes?.online ?? null;
      }
      return res.status(200).json({ online, lastOffline: offline?.offline_at ?? null });
    }

    await sql`CREATE TABLE IF NOT EXISTS ring_kitchen_view_log (
      account_id text NOT NULL REFERENCES ring_kitchen_links(account_id) ON DELETE CASCADE,
      started_at timestamptz NOT NULL DEFAULT now()
    )`;
    if (req.method === 'GET') {
      const views = await sql`SELECT started_at FROM ring_kitchen_view_log
        WHERE account_id = ${link.account_id} AND started_at >= now() - interval '30 days'
        ORDER BY started_at DESC LIMIT 100`;
      return res.status(200).json({ views });
    }

    const token = await currentAccessToken(sql, link);
    if (!token) return res.status(503).end();
    const endpoint = `/v1/devices/${encodeURIComponent(link.device_id)}/media/streaming/whep/sessions`;

    if (req.method === 'DELETE') {
      const session = req.body?.session;
      if (typeof session !== 'string' || !/^[\w.-]{1,200}$/.test(session) || ['.', '..'].includes(session)) {
        return res.status(400).end();
      }
      const result = await ringRequest(`${endpoint}/${session}`, token, { method: 'DELETE' });
      return res.status(result.ok || result.status === 404 ? 204 : 502).end();
    }

    if (req.headers['content-type'] !== 'application/sdp') return res.status(415).end();
    const offer = (await readBody(req)).toString('utf8');
    const media = offer.split(/\r?\nm=/).slice(1);
    if (media.length < 1 || media.length > 2 || !media.some(section => section.startsWith('video ')) ||
        !media.every(section => /^(video|audio) /.test(section) &&
          /^a=recvonly\r?$/m.test(section) && !/^a=(sendrecv|sendonly|inactive)\r?$/m.test(section))) {
      return res.status(400).end();
    }

    const result = await ringRequest(endpoint, token, {
      method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: offer
    });
    if (result.status !== 201) return res.status(502).end();
    const location = result.headers.get('Location');
    if (!location) return res.status(502).end();
    const sessionUrl = new URL(location, API_ORIGIN);
    const session = sessionUrl.pathname.slice(endpoint.length + 1);
    if (sessionUrl.origin !== API_ORIGIN || !sessionUrl.pathname.startsWith(endpoint + '/') ||
        !/^[\w.-]{1,200}$/.test(session)) return res.status(502).end();
    try {
      await sql`INSERT INTO ring_kitchen_view_log (account_id) VALUES (${link.account_id})`;
    } catch (error) {
      await ringRequest(`${endpoint}/${session}`, token, { method: 'DELETE' }).catch(() => {});
      throw error;
    }
    return res.status(200).json({ answer: await result.text(), session });
  } catch (error) {
    return res.status(error instanceof RangeError ? 413 : 502).end();
  }
}
