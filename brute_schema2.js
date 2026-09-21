import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
async function test() {
    let payload = { 
        "admin id": "1", 
        "cluster id": "1", 
        "rider id": "00000000-0000-0000-0000-000000000000", 
        "penalty amount": "0", 
        "penalty status": "active",
        "created_at": new Date().toISOString(),
        "updated_at": new Date().toISOString()
    };
    while(true) {
        const { data, error } = await supabase.from('riders_penalty').insert([payload]).select('*');
        if (error) {
            if (error.message.includes("Could not find the ")) {
                const match = error.message.match(/Could not find the '([^']+)' column/);
                if (match) {
                    console.log("Removing column:", match[1]);
                    delete payload[match[1]];
                } else {
                    console.log("Unknown missing column error:", error);
                    break;
                }
            } else {
                console.log("Other error:", error);
                break;
            }
        } else {
            console.log("Success data:", data);
            if(data && data.length > 0) {
                await supabase.from('riders_penalty').delete().eq('id', data[0].id);
            }
            break;
        }
    }
}
test();
