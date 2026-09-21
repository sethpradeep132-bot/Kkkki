import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const clusterId = 'b7f5c0b8-e705-4f42-9345-f9add372fb78'; // admin
  const { data: readyShipments } = await sb.from('accepted_shipments').select('id, "selller id", "cluster id", "admin id"').ilike('shipment type', '%ready to pickup%');
  
  let c1 = readyShipments.filter(s => s['cluster id'] === clusterId || s['admin id'] === clusterId).length;
  console.log("Admin Ready shipments:", c1);
}
run();
