import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: cols } = await supabase.from('accepted_shipments').select('*').limit(1);
  console.log("accepted shipments count:", cols ? cols.length : 0);
  const { data: cols2 } = await supabase.from('customer_orders').select('*').limit(1);
  if (cols2 && cols2.length > 0) {
      console.log("Customer orders keys:", Object.keys(cols2[0]));
  }
}
check();
