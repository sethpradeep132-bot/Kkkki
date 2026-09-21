const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('customer_orders').select('id, "order ID", "product id", "product image"').limit(1);
  console.log('Customer Orders:', data);
  
  const { data: ac, error: ace } = await supabase.from('accepted_shipments').select('id, "order ID", "product id"').limit(1);
  console.log('Accepted Shipments:', ac);
}
test();
