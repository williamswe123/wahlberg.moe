import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For managed providers like Supabase/Neon you might need:
  // ssl: { rejectUnauthorized: false },
});
