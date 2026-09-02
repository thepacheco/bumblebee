/* Honey Bee Boba — story photo gallery API (Vercel Serverless + Neon Postgres).
 *
 * Photos are stored in the SAME Neon database as the check-in (no extra setup).
 * Any filename works — files are stored by content, not name. HEIC is converted
 * to JPEG in the browser before upload, so everything here is a normal image.
 *
 *   GET    /api/photos            -> { photos:[{id, at}] }   (newest first)
 *   GET    /api/photos?id=123     -> the image bytes (cacheable)
 *   POST   /api/photos {data}     -> store a base64 data URL, returns { id }
 *   DELETE /api/photos?id=123     -> remove one
 */
import { neon } from "@neondatabase/serverless";

const MAX_PHOTOS = 60;

function connString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

export default async function handler(req, res) {
  const conn = connString();
  if (!conn) return res.status(503).json({ error: "no_database" });

  try {
    const sql = neon(conn);
    await sql`CREATE TABLE IF NOT EXISTS photos (
      id bigserial PRIMARY KEY, mime text, data text, at bigint NOT NULL
    )`;

    if (req.method === "GET") {
      const id = req.query && req.query.id;
      if (id) {
        const rows = await sql`SELECT mime, data FROM photos WHERE id = ${id}`;
        if (!rows.length) return res.status(404).end();
        const buf = Buffer.from(rows[0].data, "base64");
        res.setHeader("Content-Type", rows[0].mime || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.status(200).send(buf);
      }
      const rows = await sql`SELECT id, at FROM photos ORDER BY at DESC LIMIT ${MAX_PHOTOS}`;
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ photos: rows.map((r) => ({ id: String(r.id), at: Number(r.at) })) });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      let data = body.data || "";
      let mime = body.mime || "image/jpeg";
      const m = /^data:([^;]+);base64,(.*)$/.exec(data);
      if (m) { mime = m[1]; data = m[2]; }
      if (!data) return res.status(400).json({ error: "no_data" });
      if (data.length > 8 * 1024 * 1024) return res.status(413).json({ error: "too_large" });

      const now = Date.now();
      const ins = await sql`INSERT INTO photos (mime, data, at) VALUES (${mime}, ${data}, ${now}) RETURNING id`;
      await sql`DELETE FROM photos WHERE id NOT IN (
                  SELECT id FROM photos ORDER BY at DESC LIMIT ${MAX_PHOTOS}
                )`;
      return res.status(200).json({ id: String(ins[0].id) });
    }

    if (req.method === "DELETE") {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: "no_id" });
      await sql`DELETE FROM photos WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    return res.status(500).json({ error: "db_error", detail: String((e && e.message) || e) });
  }
}
