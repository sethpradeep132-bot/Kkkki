import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: shipDataList } = await supabase.from('accepted_shipments').select('*').limit(1);
  if (shipDataList && shipDataList.length > 0) {
    console.log("ShipData Keys:", Object.keys(shipDataList[0]));
    const sellerId = shipDataList[0]['selller id'] || shipDataList[0]['seller id'];
    const hubId = shipDataList[0]['hub manager id'];
    console.log("Seller ID:", sellerId, "Hub ID:", hubId);
    if (sellerId) {
      const { data: seller } = await supabase.from('sellers').select('*').eq('id', sellerId).single();
      console.log("Seller:", seller);
    }
    if (hubId) {
      const { data: hub } = await supabase.from('hub_managers').select('*').eq('id', hubId).single();
      console.log("Hub Manager:", hub);
    }
  }
}
check();
