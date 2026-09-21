import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const clusterId = '12345678-1234-1234-1234-123456789012';
  const hubManagerIds = ['12345678-1234-1234-1234-123456789013', '12345678-1234-1234-1234-123456789014'];
  
  const qStr = `"cluster id".eq.${clusterId},"hub manager id".in.(${hubManagerIds.join(',')})`;
  console.log("Query String:", qStr);
  
  const { data, error } = await sb.from('added_pincode')
      .select('*')
      .or(qStr);
      
  console.log("Error:", error);
}
run();
