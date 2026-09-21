import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
supabase.rpc('hello_world').then(() => {}).catch(() => {}) // just wake up
async function getCols(table) {
  const { data, error } = await supabase.from(table).select('admin id').limit(1)
  console.log(table, 'admin id error:', error?.message)
}
getCols('cash_with_riders')
getCols('online_payments')
