import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const customId = '11111111-2222-3333-4444-555555555555';
  console.log("Trying to create user with ID:", customId);
  const { data, error } = await supabase.auth.admin.createUser({
    id: customId,
    email: 'test_create_id_3@example.com',
    password: 'password123',
    email_confirm: true
  });
  
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
