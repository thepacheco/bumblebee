/* Honey Bee Boba — check-in state API (Vercel Serverless Function + Neon Postgres).
 *
 * Stores everything in your database:
 *   presence  — each side's current status + last-seen ("lock-on") time
 *   checkins  — the full timestamped history of every check-in
 *
 *   GET  /api/state                      -> { nama, you, log }
 *   POST /api/state {action:'status', side, status}
 *   POST /api/state {action:'heartbeat', side}
 *
 * Connect a Neon Postgres database to this project (Storage tab) — it injects
 * DATABASE_URL, which this function reads. Everything runs inside the handler
 * with try/catch so a missing/bad connection returns a clean message instead
 * of crashing the function.
 */
import { neon } from "@neondatabase/serverless";

const LOG_CAP = 100;

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

function emptyState() {
  return {
    nama: { status: null, at: 0, beat: 0 },
    you:  { status: null, at: 0, beat: 0 },
    log:  []
  };
}

export default async function handler(req, res) {
  const conn = connString();
  if (!conn) {
    // No database connected yet — tell the client clearly. The site's sync
    // layer treats this as "not ready" and falls back to local storage.
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ error: "no_database", hint: "Connect a Neon Postgres store to this Vercel project (Storage tab); it sets DATABASE_URL." });
  }

  try {
    const sql = neon(conn);

    // create tables on first use
    await sql`CREATE TABLE IF NOT EXISTS presence (
      side text PRIMARY KEY, status jsonb, at bigint DEFAULT 0, beat bigint DEFAULT 0
    )`;
    await sql`CREATE TABLE IF NOT EXISTS checkins (
      id bigserial PRIMARY KEY, side text NOT NULL, status jsonb, at bigint NOT NULL
    )`;

    if (req.method === "GET") {
      const pres = await sql`SELECT side, status, at, beat FROM presence`;
      const log  = await sql`SELECT side, status, at FROM checkins ORDER BY at DESC LIMIT ${LOG_CAP}`;
      const state = emptyState();
      for (const r of pres) {
        if (r.side === "nama" || r.side === "you") {
          state[r.side] = { status: r.status, at: Number(r.at), beat: Number(r.beat) };
        }
      }
      state.log = log.map((r) => ({ side: r.side, status: r.status, at: Number(r.at) }));
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(state);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const side = body.side;
      if (side !== "nama" && side !== "you") return res.status(400).json({ error: "bad_side" });
      const now = Date.now();

      if (body.action === "heartbeat") {
        await sql`INSERT INTO presence (side, beat) VALUES (${side}, ${now})
                  ON CONFLICT (side) DO UPDATE SET beat = EXCLUDED.beat`;
        return res.status(200).json({ ok: true });
      }

      if (body.action === "status") {
        const statusStr = JSON.stringify(body.status || {});
        await sql`INSERT INTO presence (side, status, at, beat)
                  VALUES (${side}, ${statusStr}::jsonb, ${now}, ${now})
                  ON CONFLICT (side) DO UPDATE
                    SET status = EXCLUDED.status, at = EXCLUDED.at, beat = EXCLUDED.beat`;
        await sql`INSERT INTO checkins (side, status, at) VALUES (${side}, ${statusStr}::jsonb, ${now})`;
        await sql`DELETE FROM checkins WHERE id NOT IN (
                    SELECT id FROM checkins ORDER BY at DESC LIMIT ${LOG_CAP}
                  )`;
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: "bad_action" });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "db_error", detail: String((e && e.message) || e) });
  }
}
