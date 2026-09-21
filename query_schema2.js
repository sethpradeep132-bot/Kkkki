import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: hmData, error: hmErr } = await supabase.from('hub_managers_penalty').insert([{ dummy_col: 1 }]);
    console.log("hmErr:", hmErr);

    const { data: rData, error: rErr } = await supabase.from('riders_penalty').insert([{ dummy_col: 1 }]);
    console.log("rErr:", rErr);
}
main();
