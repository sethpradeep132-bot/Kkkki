require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('hub_managers').select('*').limit(1);
  console.log("Error:", error);
  if (data && data.length > 0) {
    console.log("Keys:", Object.keys(data[0]));
  }
}
check();
