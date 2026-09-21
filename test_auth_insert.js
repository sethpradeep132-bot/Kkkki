import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // Try to sign in as some user, or we can just pass an access token if we can get one.
  // Actually, we can check RLS policies in the database using postgres.
}
run();
