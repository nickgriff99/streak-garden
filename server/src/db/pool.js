import { Pool } from 'pg';

// One pool for the whole process. Supabase's pooled connection strings
// already do PgBouncer-style pooling on their end, this is just the
// node-side pg.Pool that every query borrows a client from.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

// node-postgres crashes whole process on unhandled Pool 'error' event
// (idle client dropped by Supabase, network blip). Log it, don't let it kill the site.
pool.on('error', (err) => {
  console.error('Unexpected pg pool error', err);
});

export default pool;
