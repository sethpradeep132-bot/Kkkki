const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('rider_shipment_work_flow').select('*').limit(1);
  if (error) console.error(error);
  if (data && data.length > 0) console.log("rswf:", Object.keys(data[0]));
  else console.log("rswf: No data");
}
run();
