const { supabase } = require('./src/lib/supabase');
async function run() {
  const { data } = await supabase.from('rider_live_work_flow').select('*').limit(1);
  console.log(data);
}
run();
