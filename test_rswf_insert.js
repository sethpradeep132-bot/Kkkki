import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: wf, error: fetchErr } = await supabase.from('rider_live_work_flow').select('*').limit(1);
  if (fetchErr) {
    console.error("fetch err", fetchErr);
    return;
  }
  if (!wf || wf.length === 0) {
    console.log("No data to test");
    return;
  }
  const toInsert = { ...wf[0] };
  delete toInsert.id;
  console.log("Inserting:", toInsert);
  const { data, error } = await supabase.from('rider_shipment_work_flow').insert([toInsert]);
  console.log("Insert result:", error, data);
}
run();
