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
  const cwrDef = json.definitions['cash_with_riders'];
  if (cwrDef) {
      console.log(Object.keys(cwrDef.properties));
  } else {
      console.log("Not found");
  }
}
run();
