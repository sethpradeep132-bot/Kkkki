import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  const { data: shipments } = await supabaseAdmin.from('accepted_shipments').select('*').limit(1);
  if (shipments) console.log('accepted_shipments:', Object.keys(shipments[0] || {}));
}
test();
