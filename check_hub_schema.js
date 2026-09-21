import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: cols } = await supabase.from('hub_managers').select('*').limit(1);
  if (cols && cols.length > 0) {
      console.log("Hub Managers keys:", Object.keys(cols[0]));
  }
}
check();
