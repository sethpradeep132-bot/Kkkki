import dotenv from 'dotenv';
dotenv.config();
async function run() {
  const req = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
      headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
  });
  const json = await req.json();
  const def1 = json.definitions['rider_live_work_flow'];
  const def2 = json.definitions['rider_shipment_work_flow'];
  console.log("Live:", def1 ? Object.keys(def1.properties) : "Not found");
  console.log("Shipment:", def2 ? Object.keys(def2.properties) : "Not found");
}
run();
