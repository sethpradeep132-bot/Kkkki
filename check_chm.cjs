const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('cash_with_hub_managers').select('*').limit(1);
  console.log("cash_with_hub_managers cols:", data ? Object.keys(data[0] || {}) : error);
}
run();
