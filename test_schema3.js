import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
async function test() {
    const res = await fetch(`${supabaseUrl}/rest/v1/hub_managers_penalty`, { 
        method: 'OPTIONS',
        headers: { 
            'apikey': supabaseKey, 
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    console.log(await res.text());
}
test();
