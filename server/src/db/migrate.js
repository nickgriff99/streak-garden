import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import 'dotenv/config';
import pool from './pool.js';

// Deliberately simple, not a migration framework: no history table, no
// version tracking, no up/down pairs. schema.sql is small (3 tables) and
// every statement in it is already idempotent ("create ... if not
// exists"), so "run this file" and "apply schema.sql to DATABASE_URL" are
// the same thing no matter how many times it's run. If the schema grows
// enough to need ordered, trackable migrations, replace this script then,
// don't grow it into one in place.

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, 'schema.sql');

async function migrate() {
  const sql = readFileSync(schemaPath, 'utf8');

  console.log(`streak-garden migrate: applying ${schemaPath}`);
  try {
    await pool.query(sql);
    console.log(
      'streak-garden migrate: done. users, habits, checkins created if missing; habits.species column added if missing; existing data untouched.'
    );
  } catch (err) {
    console.error('streak-garden migrate: failed,', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
