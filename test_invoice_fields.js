import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: asc } = await supabase.from('accepted_shipments').select('*').limit(1);
  console.log("accepted_shipments cols:", asc ? Object.keys(asc[0]) : null);
}
check();
