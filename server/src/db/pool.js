import { Pool } from 'pg';

// One pool for the whole process. Supabase's pooled connection strings
// already do PgBouncer-style pooling on their end, this is just the
// node-side pg.Pool that every query borrows a client from.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

export default pool;
