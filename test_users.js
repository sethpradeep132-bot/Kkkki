import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const clusterId = 'b7f5c0b8-e705-4f42-9345-f9add372fb78';
  const { data: hm } = await sb.from('hub_managers').select('*').eq('cluster_id', clusterId);
  console.log("Hub managers for admin:", hm?.length);
  if (hm && hm.length > 0) {
      console.log(hm[0].cluster_id);
  }
}
run();
