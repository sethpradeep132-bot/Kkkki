import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('cash_with_hub_managers').select('*').limit(1);
  if (data && data[0]) console.log(Object.keys(data[0]));
}
run();
