import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('riders_for_approval').insert([
    {
      avatar: 'https://example.com/avatar.png',
      rider_name: 'Test Rider Anon',
      registered_mobile_number: '8888888888',
      password: 'testpassword'
    }
  ]).select();
  console.log("Insert result:", data, error);
}
test();
