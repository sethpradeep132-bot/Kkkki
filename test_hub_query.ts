import { supabase } from './src/lib/supabase';
async function run() {
  const { data } = await supabase.from('hub_managers').select('hub_name');
  console.log(data);
}
run();
