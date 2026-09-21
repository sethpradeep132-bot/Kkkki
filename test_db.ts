import { supabase } from './src/lib/supabase';
async function run() {
  const { data } = await supabase.from('customer_orders').select('id, "order ID", "order status", "process type"').limit(5).order('created_at', { ascending: false });
  console.log(data);
}
run();
