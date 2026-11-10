import { createHash, randomBytes } from 'crypto';
import { execFileSync } from 'child_process';

import { LIVE_DB } from './env';

// ----------------------------------------------------------------------

/** Runs one SQL statement in the server's Postgres and returns its rows as text. */
function psql(sql: string) {
  return execFileSync(
    'docker',
    [
      'exec',
      '-i',
      LIVE_DB.container,
      'psql',
      '-U',
      LIVE_DB.user,
      '-d',
      LIVE_DB.database,
      '-v',
      'ON_ERROR_STOP=1',
      '-tA',
    ],
    { input: sql, encoding: 'utf8' }
  ).trim();
}

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

/**
 * The server stores only the SHA-256 of the emailed token, so the link can't be read
 * back. Instead a known token is put in its place; opening `/verify-email?token=`
 * with it then goes through the real verification.
 */
export function issueVerifyToken(email: string) {
  const token = randomBytes(24).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  const updated = psql(
    `UPDATE "User" SET "emailVerifyToken" = ${quote(hash)},
       "emailVerifyExpiresAt" = now() + interval '1 hour'
     WHERE lower("email") = lower(${quote(email)}) AND "isDeleted" = false
     RETURNING "id";`
  );
  if (!updated) throw new Error(`No registered user with email ${email}`);
  return token;
}
