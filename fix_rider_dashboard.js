const fs = require('fs');
let content = fs.readFileSync('src/components/portals/RiderDashboardView.tsx', 'utf8');

const oldLogic = `      const { data: existing, error: existingErr } = await supabase.from('rider_live_work_flow').select('id').eq('rider_id', riderId).limit(1).maybeSingle();
      if (existingErr && existingErr.code !== 'PGRST116') {
         if (existingErr.message && existingErr.message.includes('Failed to fetch')) {
            // Silently ignore network aborts/disconnects for this non-critical background update
         } else {
            console.error("Error fetching existing live work flow:", existingErr);
         }
      }
      
      if (existing) {
        const { error: updateErr } = await supabase.from('rider_live_work_flow').update(payload).eq('id', existing.id);
        if (updateErr && !updateErr.message?.includes('Failed to fetch')) console.error("Error updating live work flow:", updateErr);
      } else {
        const { error: insertErr } = await supabase.from('rider_live_work_flow').insert([payload]);
        if (insertErr && !insertErr.message?.includes('Failed to fetch')) console.error("Error inserting live work flow:", insertErr);
      }`;

const newLogic = `      const { data: existingRows, error: existingErr } = await supabase.from('rider_live_work_flow').select('id').eq('rider_id', riderId);
      if (existingErr) {
         if (existingErr.message && existingErr.message.includes('Failed to fetch')) {
            // Silently ignore network aborts
         } else {
            console.error("Error fetching existing live work flow:", existingErr);
         }
      }
      
      if (existingRows && existingRows.length > 0) {
        const { error: updateErr } = await supabase.from('rider_live_work_flow').update(payload).eq('id', existingRows[0].id);
        if (updateErr && !updateErr.message?.includes('Failed to fetch')) console.error("Error updating live work flow:", updateErr);
        
        // Clean up duplicates (the "kachra")
        if (existingRows.length > 1) {
            const idsToDelete = existingRows.slice(1).map(r => r.id);
            await supabase.from('rider_live_work_flow').delete().in('id', idsToDelete);
        }
      } else {
        const { error: insertErr } = await supabase.from('rider_live_work_flow').insert([payload]);
        if (insertErr && !insertErr.message?.includes('Failed to fetch')) console.error("Error inserting live work flow:", insertErr);
      }`;

if (content.includes("maybeSingle()")) {
    content = content.replace(oldLogic, newLogic);
    fs.writeFileSync('src/components/portals/RiderDashboardView.tsx', content);
    console.log("RiderDashboardView fixed");
} else {
    console.log("Not found");
}
