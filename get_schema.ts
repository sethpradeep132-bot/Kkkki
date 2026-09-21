import { supabase } from './src/lib/supabase';

const tables = [
    'profiles', 'customers', 'sellers', 'riders', 'hub_managers', 'clusters', 'admins',
    'customer_orders', 'accepted_shipments', 'finished_shipments',
    'added_riders', 'carts', 'cash_with_admin', 'cash_with_clusters', 'cash_with_hub_managers', 'cash_with_riders',
    'contact_link', 'customer_address', 'finished_clusters_payable_amount', 'finished_customers_payable_amount',
    'finished_hub_managers_payable_amount', 'finished_riders_payable_amount', 'finished_sellers_payable_amount',
    'fixed_hub_manager_salary', 'gift_cash', 'hub_manager_salary', 'hub_managers_penalty', 'inactive_products',
    'rider_live_work_flow', 'rider_rate_setting', 'rider_rate_setting_with_cluster', 'rider_service_rates',
    'rider_shipment_work_flow', 'riders_penalty', 'save_in_draft', 'sellers_for_approval', 'selller_income_estimate',
    'settled_hub_manager_salary', 'settled_rider_shipments', 'settled_selller_income_estimate', 'upload_products'
  ];

async function run() {
  const schema: any = {};
  for (const t of tables) {
    const { data } = await supabase.from(t).select('*').limit(1);
    if (data && data.length > 0) {
      schema[t] = Object.keys(data[0]);
    } else {
      schema[t] = [];
    }
  }
  console.log(JSON.stringify(schema, null, 2));
}

run();
