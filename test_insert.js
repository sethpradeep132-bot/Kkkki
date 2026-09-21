import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
async function test() {
    const { data: d1, error: e1 } = await supabase.from('hub_managers_penalty').insert({ "admin id": "dummy", "hub manager id": "dummy", "penalty amount": "0", "penalty status": "active" }).select('*');
    console.log("hmData:", d1, "e1:", e1);
    if(d1 && d1.length > 0) {
        await supabase.from('hub_managers_penalty').delete().eq('id', d1[0].id);
    }

    const { data: d2, error: e2 } = await supabase.from('riders_penalty').insert({ "admin id": "dummy", "rider id": "dummy", "penalty amount": "0", "penalty status": "active" }).select('*');
    console.log("rData:", d2, "e2:", e2);
    if(d2 && d2.length > 0) {
        await supabase.from('riders_penalty').delete().eq('id', d2[0].id);
    }
}
test();
