import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const userId = '12345678-1234-1234-1234-123456789012';
  const myHubName = 'Test Hub';
  
  const { data, error } = await sb.from('added_pincode')
      .select('*')
      .or(`"hub manager id".eq.${userId},"hub name".eq."${myHubName}"`);
      
  console.log("Error:", error);
}
run();
