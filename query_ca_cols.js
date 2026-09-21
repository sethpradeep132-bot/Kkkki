import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('customer_address').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log("Columns:", data && data.length > 0 ? Object.keys(data[0]) : "No rows");
  }
}
run();
