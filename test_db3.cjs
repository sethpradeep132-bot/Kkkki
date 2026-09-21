const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('customer_orders').select('id, "product image"').limit(1);
  if (data && data.length > 0) {
    const val = data[0]['product image'];
    console.log('typeof:', typeof val);
    console.log('first 50 chars:', typeof val === 'string' ? val.substring(0, 50) : val);
  }
}
test();
