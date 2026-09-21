import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const userId = '5683ed30-22e2-4a17-acb5-cfcc8d845d4e'; // Our hub manager

  const { data: hmData } = await sb.from('hub_managers').select('hub_name, registered_pincode').eq('id', userId).maybeSingle();
  let myHubName = hmData?.hub_name || '';
  let myPincodes = [];
  if (hmData?.registered_pincode) {
      myPincodes.push(hmData.registered_pincode);
  }

  let pQuery = sb.from('added_pincode').select('*');
  if (myHubName) {
      pQuery = pQuery.or(`"hub manager id".eq.${userId},"hub name".eq."${myHubName}"`);
  } else {
      pQuery = pQuery.eq('hub manager id', userId);
  }
  const { data: addedPincodeData } = await pQuery;
  if (addedPincodeData) {
      addedPincodeData.forEach(d => {
          if (d['added pincode']) myPincodes.push(d['added pincode']);
      });
  }

  console.log("My Pincodes:", myPincodes);

  const { data: readyShipments } = await sb.from('accepted_shipments').select('id, "selller id", "hub manager id"').ilike('shipment type', '%ready to pickup%');
  let c1 = 0;
  if (readyShipments && readyShipments.length > 0) {
      const cleanMyPincodes = myPincodes.map(p => p?.toString().replace(/\s/g, ''));
      const sellerIds = [...new Set(readyShipments.map(s => s['selller id']).filter(Boolean))];
      if (sellerIds.length > 0) {
          const { data: sellers } = await sb.from('sellers').select('id, registered_pincode').in('id', sellerIds);
          const validSellerIds = new Set((sellers || []).filter(s => cleanMyPincodes.includes(s.registered_pincode?.toString().replace(/\s/g, ''))).map(s => s.id));
          c1 = readyShipments.filter(s => validSellerIds.has(s['selller id']) || s['hub manager id'] === userId).length;
      } else {
          c1 = readyShipments.filter(s => s['hub manager id'] === userId).length;
      }
  }
  console.log("Ready to Pickup Count:", c1);
}
run();
