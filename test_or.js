import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const clusterId = 'some-uuid';
  const h = ['uuid1', 'uuid2'];
  const q = `"cluster id".eq.${clusterId},"hub manager id".in.(${h.join(',')})`;
  console.log(q);
}
run();
