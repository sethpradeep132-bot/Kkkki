import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);
async function test() {
  const { data } = await supabaseAdmin.from('accepted_shipments').select('*').limit(1);
  console.log('Columns:', Object.keys(data[0] || {}));
}
test();
