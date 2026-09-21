import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: hm } = await supabase.from('hub_managers').select('*').limit(1);
  console.log("hub_managers:", hm);
  const { data: asc } = await supabase.from('accepted shipments').select('*').limit(1);
  console.log("accepted shipments:", asc);
}
check();
