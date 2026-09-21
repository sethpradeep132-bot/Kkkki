import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  const email = "vijayraz1234@gmail.com";
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingUser = listData.users.find(u => u.email === email);
  console.log("Found:", existingUser?.email, existingUser?.id);
}
test();
