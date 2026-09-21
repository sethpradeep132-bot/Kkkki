import re

def replace_in_file(filename, replacement, target_type):
    with open(filename, 'r') as f:
        content = f.read()

    # Find the start and end of the block to replace
    start_str = "setIsSavingRiderRate(true);"
    
    idx_start = content.find(start_str)
    if idx_start == -1:
        print(f"Could not find start string in {filename}")
        return
        
    actual_start = content.find("try {", idx_start)
    if actual_start == -1:
        return
    actual_start = content.rfind(" ", 0, actual_start) + 1
    
    end_str = "} catch (e: any) {"
    idx_end = content.find(end_str, idx_start)
    if idx_end == -1:
        print(f"Could not find end string in {filename}")
        return
    
    # backtrack to grab the indentation for catch
    actual_end = content.rfind("\n", 0, idx_end) + 1
        
    print(f"Found block in {filename} from {actual_start} to {actual_end}")
    
    new_content = content[:actual_start] + replacement + content[actual_end:]
    
    with open(filename, 'w') as f:
        f.write(new_content)
    print(f"Updated {filename}")

cluster_replacement = """try {
                         if (!specificSelectedRider) throw new Error("Select a rider first");
                         
                         let error;
                         const ratesToSave = activeRateRank === 'Regular' ? defaultRates['Regular'] : specificRiderRates;

                         const { data: existingRider } = await supabase.from('rider_service_rates').select('id').eq('rider_id', specificSelectedRider).limit(1).single();
                         
                         if (existingRider) {
                           const res = await supabase.from('rider_service_rates').update({
                             rank: activeRateRank,
                             pickup_rate: ratesToSave.pickup,
                             delivery_rate: ratesToSave.delivery,
                             return_delivery_rate: ratesToSave.return,
                             tag: activeRateRank,
                             'cluster id': adminProfileId
                           }).eq('id', existingRider.id);
                           error = res.error;
                         } else {
                           const res = await supabase.from('rider_service_rates').insert({
                             rider_id: specificSelectedRider,
                             rank: activeRateRank,
                             pickup_rate: ratesToSave.pickup,
                             delivery_rate: ratesToSave.delivery,
                             return_delivery_rate: ratesToSave.return,
                             tag: activeRateRank,
                             'cluster id': adminProfileId
                           });
                           error = res.error;
                         }
                         
                         if (error) {
                           if (error.code === '42P01') {
                             alert('Table "rider_service_rates" does not exist yet. Please run the SQL in your Supabase editor.');
                           } else throw error;
                         }
                       """

admin_replacement = """try {
                         let error;
                         const ratesToSave = activeRateRank === 'Regular' ? defaultRates['Regular'] : specificRiderRates;

                         const { data: existingActive } = await supabase.from('active_service_rate').select('id').eq('tag', activeRateRank).limit(1).single();
                         
                         if (existingActive) {
                           const res = await supabase.from('active_service_rate').update({
                             pickup_rate: ratesToSave.pickup,
                             delivery_rate: ratesToSave.delivery,
                             return_delivery_rate: ratesToSave.return,
                             tag: activeRateRank
                           }).eq('id', existingActive.id);
                           error = res.error;
                         } else {
                           const res = await supabase.from('active_service_rate').insert({
                             pickup_rate: ratesToSave.pickup,
                             delivery_rate: ratesToSave.delivery,
                             return_delivery_rate: ratesToSave.return,
                             tag: activeRateRank
                           });
                           error = res.error;
                         }
                         
                         if (error) {
                           if (error.code === '42P01') {
                             alert('Table "active_service_rate" does not exist yet. Please run the SQL in your Supabase editor.');
                           } else throw error;
                         }
                       """

replace_in_file('src/components/portals/ClusterPortal.tsx', cluster_replacement, 'cluster')
replace_in_file('src/components/portals/AdminPortal.tsx', admin_replacement, 'admin')
