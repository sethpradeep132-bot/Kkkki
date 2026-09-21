import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('cash_with_riders').select('id').limit(1);
  if (error) {
    console.log("Error:", error);
  } else {
      console.log("no error in just id");
  }
}
run();
