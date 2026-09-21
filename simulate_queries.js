import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const clusterId = 'some-cluster-id';
  
  // 1. Cluster Admin simulation
  const { data: readyShipmentsAdmin } = await sb.from('accepted_shipments').select('id, "selller id", "cluster id", "shipment type"').ilike('shipment type', '%ready to pickup%');
  console.log("Admin Shipments with 'cluster id':", readyShipmentsAdmin);

  // 2. Hub Manager simulation
  const { data: readyShipmentsHub } = await sb.from('accepted_shipments').select('id, "selller id", "hub manager id", "shipment type"').ilike('shipment type', '%ready to pickup%');
  console.log("Hub Shipments with 'hub manager id':", readyShipmentsHub);

}
run();
