import { neon } from "@neondatabase/serverless";
import pg from "pg";

// Connects to the Postgres database in DATABASE_URL with whichever client fits:
//
//   - a Neon address (*.neon.tech): Neon's own driver, which sends each query
//     over HTTPS. No connection to open or keep, which suits functions that
//     start, answer and stop.
//   - any other address: the standard client (`pg`), so a fork can use the
//     Postgres it prefers (another provider, or its own server).
//
// DATABASE_DRIVER=neon|pg overrides the choice, e.g. for a Neon database
// behind a custom domain.
//
// Either way the caller gets the same thing: a tagged template that runs a
// parameterized query and resolves with its rows.
//
//   const sql = connect(url, { timeoutMs: 8000 });
//   const [row] = await sql`SELECT version FROM t WHERE id = ${id}`;

export const usesNeonDriver = (url, override = process.env.DATABASE_DRIVER) => {
  if (override === "neon") return true;
  if (override === "pg") return false;
  try {
    return new URL(url).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
};

/** `{ text, values }` for a tagged template: every interpolation becomes a $n parameter. */
export const toQuery = (strings, values) => ({
  text: strings.reduce((text, part, i) => `${text}$${i}${part}`),
  values,
});

// The standard client keeps a small pool for as long as the function instance
// lives; a new one is made if the address changes.
let pool = null;
let poolUrl = null;

const standardClient = (url, timeoutMs) => {
  if (poolUrl !== url) {
    pool?.end().catch(() => {});
    pool = new pg.Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: timeoutMs,
      query_timeout: timeoutMs,
    });
    // An idle connection dropped by the server is not worth crashing for; the next query reconnects.
    pool.on("error", () => {});
    poolUrl = url;
  }
  const current = pool;
  return async (strings, ...values) => (await current.query(toQuery(strings, values))).rows;
};

/** `timeoutMs` bounds how long the database may take to answer. */
export const connect = (url, { timeoutMs }) =>
  usesNeonDriver(url)
    ? neon(url, { fetchOptions: { signal: AbortSignal.timeout(timeoutMs) } })
    : standardClient(url, timeoutMs);
