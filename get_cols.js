import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('riders_setting').select('*').limit(1);
  console.log(data && data[0] ? Object.keys(data[0]) : 'No data');
  
  if (!data || data.length === 0) {
    const { error: e } = await supabase.from('riders_setting').insert([{ "text setting": "test" }]);
    const { data: d } = await supabase.from('riders_setting').select('*').limit(1);
    console.log(d && d[0] ? Object.keys(d[0]) : 'Still no data', e);
  }
}
run();
