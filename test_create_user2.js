import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test_create_id_2@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      role: 'customer'
    }
  });
  
  // Try passing id: No, it's not typed. Let's see if it works anyway.
  console.log("Data:", data);
}

test();
