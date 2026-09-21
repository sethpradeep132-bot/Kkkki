import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const req = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
      headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
  });
  const json = await req.json();
  console.log(Object.keys(json.paths).filter(p => p.startsWith('/rpc')));
}
run();
