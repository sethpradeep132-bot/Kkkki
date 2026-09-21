import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('added_pincode').insert([{
    "hub manager id": "00000000-0000-0000-0000-000000000000",
    "cluster id": "00000000-0000-0000-0000-000000000000",
    "added pincode": "333333",
    "hub name": ""
  }]);
  console.log('Error:', error);
}
run();
