import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
async function test() {
  const pwrPayload = {
      'admin id': '11111111-1111-1111-1111-111111111111',
      'hub manager id': '11111111-1111-1111-1111-111111111111',
      'rider id': '11111111-1111-1111-1111-111111111111',
      'cash payment status': 'test',
      'total cash payment': '0'
  }
  let { error: e1 } = await supabase.from('cash_with_riders').insert([pwrPayload])
  console.log('cash_with_riders insert error:', e1?.message)

  const opPayload = {
      'admin id': '11111111-1111-1111-1111-111111111111',
      'hub manager id': '11111111-1111-1111-1111-111111111111',
      'rider id': '11111111-1111-1111-1111-111111111111',
      'online payment status': 'test',
      'total online payment': '0'
  }
  let { error: e2 } = await supabase.from('online_payments').insert([opPayload])
  console.log('online_payments insert error:', e2?.message)
}
test()
