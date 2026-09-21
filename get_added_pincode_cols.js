import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  const { data } = await supabase.from('added_pincode').select('*').limit(1);
  if (data) {
    console.log('added_pincode columns:', Object.keys(data[0] || {}));
  }
}
test();
