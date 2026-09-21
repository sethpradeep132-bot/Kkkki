import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
async function test() {
    const { data, error } = await supabase.from('clusters_penalty').insert({
      "admin id": "1",
      "cluster id": "00000000-0000-0000-0000-000000000000",
      "penalty amount": "0",
      "penalty status": "active"
    });
    console.log("clusters_penalty error:", error);
}
test();
