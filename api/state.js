/* Honey Bee Boba — check-in state API (Vercel Serverless Function + Postgres).
 *
 * Stores everything in your Vercel Postgres database:
 *   presence  — each side's current status + last-seen ("lock-on") time
 *   checkins  — the full timestamped history of every check-in
 *
 * Endpoints (same origin, no keys needed in the browser):
 *   GET  /api/state                      -> { nama, you, log }
 *   POST /api/state {action:'status', side, status}
 *   POST /api/state {action:'heartbeat', side}
 *
 * Requires a Postgres store connected to this Vercel project (Storage tab),
 * which injects POSTGRES_URL automatically — @vercel/postgres picks it up.
 */
import { sql } from "@vercel/postgres";

const LOG_CAP = 100;

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS presence (
    side   text PRIMARY KEY,
    status jsonb,
    at     bigint DEFAULT 0,
    beat   bigint DEFAULT 0
  )`;
  await sql`CREATE TABLE IF NOT EXISTS checkins (
    id     bigserial PRIMARY KEY,
    side   text NOT NULL,
    status jsonb,
    at     bigint NOT NULL
  )`;
}

function emptyState() {
  return {
    nama: { status: null, at: 0, beat: 0 },
    you:  { status: null, at: 0, beat: 0 },
    log:  []
  };
}

export default async function handler(req, res) {
  try {
    await ensureTables();

    if (req.method === "GET") {
      const pres = await sql`SELECT side, status, at, beat FROM presence`;
      const log  = await sql`SELECT side, status, at FROM checkins ORDER BY at DESC LIMIT ${LOG_CAP}`;
      const state = emptyState();
      for (const r of pres.rows) {
        if (r.side === "nama" || r.side === "you") {
          state[r.side] = { status: r.status, at: Number(r.at), beat: Number(r.beat) };
        }
      }
      state.log = log.rows.map((r) => ({ side: r.side, status: r.status, at: Number(r.at) }));
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(state);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const side = body.side;
      if (side !== "nama" && side !== "you") return res.status(400).json({ error: "bad side" });
      const now = Date.now();

      if (body.action === "heartbeat") {
        await sql`INSERT INTO presence (side, beat) VALUES (${side}, ${now})
                  ON CONFLICT (side) DO UPDATE SET beat = ${now}`;
        return res.status(200).json({ ok: true });
      }

      if (body.action === "status") {
        const status = JSON.stringify(body.status || {});
        await sql`INSERT INTO presence (side, status, at, beat)
                  VALUES (${side}, ${status}::jsonb, ${now}, ${now})
                  ON CONFLICT (side) DO UPDATE SET status = ${status}::jsonb, at = ${now}, beat = ${now}`;
        await sql`INSERT INTO checkins (side, status, at) VALUES (${side}, ${status}::jsonb, ${now})`;
        // trim history so the table can't grow forever
        await sql`DELETE FROM checkins WHERE id NOT IN (
                    SELECT id FROM checkins ORDER BY at DESC LIMIT ${LOG_CAP}
                  )`;
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: "bad action" });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
