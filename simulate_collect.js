import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const riderId = 'ae7c3285-3ce4-4ea3-a0d7-b196460d3773'; // known rider
  // 1. insert into rider_live_work_flow
  await supabase.from('rider_live_work_flow').delete().eq('rider_id', riderId);
  await supabase.from('rider_live_work_flow').insert([{
      rider_id: riderId,
      'All Pic & Dlv': '10',
      'Pickup': '4',
      'Delivery': '6',
      'Total Cash': '500',
      "Today's Earning": '200',
      'Performance': 'Good'
  }]);
  
  // 2. Fetch and transfer like handleCollect does
  const { data: liveWfData, error: liveWfErr } = await supabase
            .from('rider_live_work_flow')
            .select('*')
            .eq('rider_id', riderId);
            
  console.log("liveWfData before transfer:", liveWfData, liveWfErr);
  
  if (!liveWfErr && liveWfData && liveWfData.length > 0) {
      const transferData = liveWfData.map(wf => {
          const newWf = { ...wf };
          delete newWf.id; // avoid primary key conflicts
          return newWf;
      });
      console.log("Inserting transferData:", transferData);
      const res = await supabase.from('rider_shipment_work_flow').insert(transferData);
      console.log("Insert result:", res);
  }
}
run();
