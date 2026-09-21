import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: cols2 } = await supabase.from('customer_orders').select('created_at').limit(1);
  if (cols2 && cols2.length > 0) {
      const orderDate = new Date(cols2[0].created_at);
      const startOfYear = new Date(orderDate.getFullYear(), 0, 1).toISOString();
      const { count } = await supabase
          .from('customer_orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfYear)
          .lte('created_at', cols2[0].created_at);
      console.log("Count:", count);
  }
}
check();
