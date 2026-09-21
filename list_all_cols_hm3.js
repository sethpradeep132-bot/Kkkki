import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
async function go() {
  const { data, error } = await supabase.from('customer_orders').select('*').limit(1)
  console.log(Object.keys(data[0] || {}))
  const { data: aData } = await supabase.from('accepted_shipments').select('*').limit(1)
  console.log(Object.keys(aData[0] || {}))
  process.exit(0)
}
go()
