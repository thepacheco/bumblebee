/* Honey Bee Helper — private two-person messages API (Vercel Serverless + Neon).
 *
 * Uses the SAME Neon database as the check-in/photos (no separate DB needed):
 *   messages(id, side, text, at)
 *
 *   GET  /api/messages           -> { messages:[{id, side, text, at}] } (oldest first)
 *   POST /api/messages {side, text}  -> { id }
 */
import { neon } from "@neondatabase/serverless";

const MAX = 500;

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
    await sql`CREATE TABLE IF NOT EXISTS messages (
      id bigserial PRIMARY KEY, side text NOT NULL, text text NOT NULL, at bigint NOT NULL
    )`;

    if (req.method === "GET") {
      const rows = await sql`SELECT id, side, text, at FROM messages ORDER BY at DESC LIMIT ${MAX}`;
      const messages = rows
        .map((r) => ({ id: String(r.id), side: r.side, text: r.text, at: Number(r.at) }))
        .reverse(); // oldest first for display
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ messages: messages });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const side = body.side;
      if (side !== "tifajan" && side !== "you") return res.status(400).json({ error: "bad_side" });
      var text = (body.text || "").toString().trim();
      if (!text) return res.status(400).json({ error: "empty" });
      if (text.length > 1000) text = text.slice(0, 1000);
      const now = Date.now();
      const ins = await sql`INSERT INTO messages (side, text, at) VALUES (${side}, ${text}, ${now}) RETURNING id`;
      // keep the table from growing without bound
      await sql`DELETE FROM messages WHERE id NOT IN (
                  SELECT id FROM messages ORDER BY at DESC LIMIT ${MAX}
                )`;
      return res.status(200).json({ id: String(ins[0].id) });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    return res.status(500).json({ error: "db_error", detail: String((e && e.message) || e) });
  }
}
