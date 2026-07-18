// Generate a PBKDF2 salt+hash entry for the builder login (frontend-only interim).
// Usage: node scripts/gen-login-user.mjs <username> <password> [name]
// Copy the printed JSON object into LOCAL_USERS in src/lib/auth.ts.
//
// Params MUST match src/lib/auth.ts: PBKDF2-SHA256, 150000 iterations, 32-byte key.
import crypto from 'node:crypto';

const [, , username, password, name] = process.argv;
if (!username || !password) {
  console.error('Usage: node scripts/gen-login-user.mjs <username> <password> [name]');
  process.exit(1);
}

const ITERATIONS = 150000;
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto
  .pbkdf2Sync(password, Buffer.from(salt, 'hex'), ITERATIONS, 32, 'sha256')
  .toString('hex');

console.log(JSON.stringify({ username, name: name ?? username, role: 'admin', salt, hash }));
