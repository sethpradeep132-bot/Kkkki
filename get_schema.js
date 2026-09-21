import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('get_schema_info'); // if rpc is not there
  // let's just make an invalid select to see the columns in the error
  const { error: err } = await supabase.from('cash_with_riders').select('invalid_column');
  console.log(err);
}
run();
