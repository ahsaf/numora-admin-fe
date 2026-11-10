import path from 'node:path';

// Local overrides live in e2e/.env (git-ignored); see e2e/.env.example. Loaded here, not in
// the config, so the config, every test worker and the runner all see the same values.
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // No .env file: the defaults below apply.
}

/**
 * The tests drive the web app (thesuperappweb) against the real thesuperappserver and
 * its Postgres, nothing mocked. The server only allows its CORS origin
 * (http://localhost:3039 by default), so the web app must be served from there.
 */
export const LIVE_BASE_URL = process.env.LIVE_BASE_URL ?? 'http://localhost:3039';

/** The API the web app talks to; only checked for reachability before a run. */
export const LIVE_API_URL = process.env.LIVE_API_URL ?? 'http://localhost:3000';

/** Postgres of docker-compose.yml in thesuperappserver; `docker exec` runs psql in it. */
export const LIVE_DB = {
  container: process.env.LIVE_DB_CONTAINER ?? 'thesuperappserver-postgres-1',
  user: process.env.LIVE_DB_USER ?? 'superapp',
  database: process.env.LIVE_DB_NAME ?? 'thesuperapp',
};
