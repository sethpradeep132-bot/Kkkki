const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test(clusterId) {
  let orCondition = '';
  if (clusterId) {
    const { data: hubManagers, error: hmErr } = await supabase.from('hub_managers').select('id').eq('cluster_id', clusterId);
    if (hmErr) console.error("HM ERR:", hmErr);
    const hubManagerIds = hubManagers ? hubManagers.map(hm => hm.id) : [];
    const inFilter = hubManagerIds.length > 0 ? `"hub manager id".in.(${hubManagerIds.join(',')})` : '';
    orCondition = inFilter ? `${inFilter},"cluster id".eq.${clusterId}` : `"cluster id".eq.${clusterId}`;
  }

  const getCountIlike = async (matchType) => {
    let query = supabase.from('accepted_shipments').select('*', { count: 'exact', head: true });
    if (orCondition) {
      query = query.or(orCondition);
    }
    query = query.ilike('shipment type', matchType);
    const res = await query;
    if (res.error) console.error("ERR in", matchType, ":", res.error);
    return res.count || 0;
  };

  const c2 = await getCountIlike('%out for pickup%');
  console.log("Out for pickup:", c2);
}

test('160b03ac-66c2-41a9-97fd-3d7f6cff4197').catch(console.error);
