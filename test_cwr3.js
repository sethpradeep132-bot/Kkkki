import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  let res = await supabase.from('cash_with_riders').select('"rider id"').limit(1);
  console.log("rider id:", res.error?.message || "exists");
  
  res = await supabase.from('cash_with_riders').select('Rider id').limit(1);
  console.log("Rider id:", res.error?.message || "exists");
  
  res = await supabase.from('cash_with_riders').select('rider_id').limit(1);
  console.log("rider_id:", res.error?.message || "exists");
  
  res = await supabase.from('cash_with_riders').select('"hub manager id"').limit(1);
  console.log("hub manager id:", res.error?.message || "exists");
}
run();
