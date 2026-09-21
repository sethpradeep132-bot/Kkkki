const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const envContent = fs.readFileSync('.env.example', 'utf8') || fs.readFileSync('.env', 'utf8');
  let supabaseUrl = '';
  let supabaseKey = '';
  
  // try to find VITE_SUPABASE_URL
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
  if (keyMatch) supabaseKey = keyMatch[1].trim();

  if (!supabaseUrl || !supabaseKey) {
     console.log("No supabase creds found");
     return;
  }
  console.log("Supabase URL", supabaseUrl);
}
run();
