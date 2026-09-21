import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);
async function test() {
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  console.log("Total users:", listData?.users?.length);
  const u = listData?.users?.find(u => u.email === "vijayraz1234@gmail.com");
  console.log("Found?", !!u);
}
test();
