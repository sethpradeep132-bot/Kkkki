import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_triggers', {});
  if (error) {
    console.log("RPC get_triggers not found or failed:", error.message);
  } else {
    console.log("Triggers:", data);
  }
}
check();
