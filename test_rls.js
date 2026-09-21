import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY); // use anon key
async function run() {
  const { data, error } = await supabase.from('rider_shipment_work_flow').insert([{
    rider_id: 'test',
    'Total Cash': '0'
  }]);
  console.log("Anon insert:", error);
}
run();
