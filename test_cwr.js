import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const req = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/cash_with_riders?limit=1`, {
      headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
  });
  console.log("Status:", req.status);
  console.log(await req.text());
}
run();
