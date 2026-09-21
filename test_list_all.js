import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);
async function test() {
  const { data: listData, error } = await supabaseAdmin.auth.admin.listUsers();
  console.log("Error:", error);
  console.log("Data:", listData);
}
test();
