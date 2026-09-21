const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('customer_orders').select('id, "order ID", "product id", "product image"').limit(1);
  console.log('typeof product image:', typeof data[0]['product image']);
  console.log('value:', data[0]['product image']);
}
test();
