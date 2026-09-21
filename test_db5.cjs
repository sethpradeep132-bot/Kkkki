const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('products').select('id, "product images"').order('created_at', { ascending: false }).limit(3);
  if (data) {
    data.forEach(d => {
      const val = d['product images'];
      console.log('val isArray?', Array.isArray(val));
      if (Array.isArray(val)) {
         console.log('first element:', typeof val[0] === 'string' ? val[0].substring(0, 30) : val[0]);
      } else {
         console.log('typeof:', typeof val, 'val:', val ? val.substring(0,30) : val);
      }
    });
  }
}
test();
