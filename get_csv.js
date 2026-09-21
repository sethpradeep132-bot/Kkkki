import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
async function test() {
    const res = await fetch(`${supabaseUrl}/rest/v1/hub_managers_penalty?limit=1`, { 
        headers: { 
            'apikey': supabaseKey, 
            'Authorization': `Bearer ${supabaseKey}`,
            'Accept': 'text/csv' 
        }
    });
    console.log(await res.text());

    const res2 = await fetch(`${supabaseUrl}/rest/v1/riders_penalty?limit=1`, { 
        headers: { 
            'apikey': supabaseKey, 
            'Authorization': `Bearer ${supabaseKey}`,
            'Accept': 'text/csv' 
        }
    });
    console.log(await res2.text());
}
test();
