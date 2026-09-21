const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('customer_orders').select('id, "product image"').order('created_at', { ascending: false }).limit(3);
  if (data) {
    data.forEach(d => {
      const val = d['product image'];
      if (!val) { console.log('Empty image'); return; }
      console.log('val has ||| ?', typeof val === 'string' && val.includes('|||'));
      console.log('starts with:', val.substring(0, 30));
    });
  }
}
test();
