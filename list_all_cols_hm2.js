import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);
async function test() {
     const { data: d2, error: e2 } = await supabase.from('hub_manager_sallery').insert({}).select('*');
     console.log("e2", e2, d2);
}
test();
