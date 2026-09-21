import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
async function test() {
    const { error } = await supabase.from('hub_managers_penalty').insert([{ dummy_col: 1 }]);
    console.log("hm_error:", error?.message);
    const { error: r_error } = await supabase.from('riders_penalty').insert([{ dummy_col: 1 }]);
    console.log("r_error:", r_error?.message);
}
test();
