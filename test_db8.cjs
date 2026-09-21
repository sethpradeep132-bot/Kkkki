const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('upload_products').select('id, "product name", "product images"').order('created_at', { ascending: false }).limit(3);
  if (data) {
    data.forEach(d => {
      console.log('Product:', d['product name']);
      const imgs = d['product images'];
      if (!imgs) { console.log('No images'); }
      else if (Array.isArray(imgs)) {
        console.log('Array of length:', imgs.length, 'first:', typeof imgs[0] === 'string' ? imgs[0].substring(0,30) : imgs[0]);
      } else {
        console.log('Type:', typeof imgs, 'Value:', typeof imgs === 'string' ? imgs.substring(0,30) : imgs);
      }
    });
  }
}
test();
