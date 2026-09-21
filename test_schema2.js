import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  const { data, error } = await supabase.from('chat_for_customers').insert([{message: "test"}]).select('*');
  console.log("inserted:", data);
  console.log("error:", error);
  const del = await supabase.from('chat_for_customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("delete:", del.error);
}
test();
