import {
  API_ORIGIN, database, decryptTokens, readBody, ringRequest, SESSION_COOKIE, tokenDigest
} from '../lib/ring-server.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Permissions-Policy', 'microphone=(), camera=()');
  if (!['POST', 'DELETE'].includes(req.method)) return res.status(405).end();
  if (req.headers.origin !== 'https://www.beejan.co') return res.status(403).end();

  const cookie = req.cookies?.[SESSION_COOKIE];
  if (typeof cookie !== 'string' || !/^[\w-]{43}$/.test(cookie)) return res.status(401).end();

  try {
    const sql = database();
    const [link] = await sql`SELECT l.* FROM ring_kitchen_links l
      JOIN ring_kitchen_viewers v ON v.account_id = l.account_id
      WHERE v.token_hash = ${tokenDigest(cookie)} AND v.expires_at > now()`;
    if (!link) return res.status(401).end();

    const token = decryptTokens(link.account_id, link.encrypted_tokens).accessToken;
    if (new Date(link.expires_at).getTime() <= Date.now()) return res.status(503).end();
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
    return res.status(200).json({ answer: await result.text(), session });
  } catch (error) {
    return res.status(error instanceof RangeError ? 413 : 502).end();
  }
}
