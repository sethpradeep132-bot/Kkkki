import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('added_riders').insert([{
    "hub manager id": "00000000-0000-0000-0000-000000000000",
    "added rider id": "00000000-0000-0000-0000-000000000000",
    "hub name": "Test",
    "cluster id": "00000000-0000-0000-0000-000000000000"
  }]);
  console.log('Error:', error);
}
run();
