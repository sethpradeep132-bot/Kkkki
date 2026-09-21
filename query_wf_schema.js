import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: wf1 } = await supabase.from('rider_live_work_flow').select('*').limit(1);
  const { data: wf2 } = await supabase.from('rider_shipment_work_flow').select('*').limit(1);
  console.log("Live WF:", Object.keys(wf1?.[0] || {}));
  console.log("Shipment WF:", Object.keys(wf2?.[0] || {}));
}
run();
