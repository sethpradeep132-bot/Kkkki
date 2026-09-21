const fs = require('fs');
let code = fs.readFileSync('src/components/portals/HubDashboardView.tsx', 'utf8');

const target = `                const { error: insertErr } = await supabase.from('rider_shipment_work_flow').insert(transferData);
                if (!insertErr) {
                    await supabase.from('rider_live_work_flow').delete().eq('rider_id', riderId);
                }`;

const replacement = `                const { error: insertErr } = await supabase.from('rider_shipment_work_flow').insert(transferData);
                if (insertErr) console.error("History insert error:", insertErr);
                // ALWAYS delete so Rider Dashboard resets properly to 0
                await supabase.from('rider_live_work_flow').delete().eq('rider_id', riderId);`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/portals/HubDashboardView.tsx', code);
    console.log("Replaced HubDash");
} else {
    console.log("Target not found in HubDash");
}
