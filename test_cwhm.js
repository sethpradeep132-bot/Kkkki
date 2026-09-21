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
  const cwhmDef = json.definitions['cash_with_hub_managers'];
  if (cwhmDef) {
      console.log(Object.keys(cwhmDef.properties));
  } else {
      console.log("Not found");
  }
}
run();
