import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const hugeString = "a".repeat(10 * 1024 * 1024); // 10MB
  console.log("Sending 10MB...");
  const { data, error } = await supabase.from('customer_orders').insert([{
    "admin id": null,
    "product image": hugeString
  }]);
  if (error) console.error("Error:", error);
  else console.log("Success");
}
run();
