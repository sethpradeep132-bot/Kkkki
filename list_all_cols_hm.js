import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);
async function test() {
  const { data, error } = await supabase.rpc('get_columns_for_table', { table_name: 'hub_manager_sallery' });
  if (error) {
     console.log("No rpc, let's just insert and see error or something.", error);
     const { data: d2, error: e2 } = await supabase.from('hub_manager_sallery').insert({ asdf: 1 }).select('*');
     console.log("e2", e2);
  } else {
     console.log(data);
  }
}
test();
