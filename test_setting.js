import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
supabase.from('riders_setting').select('attendence').limit(1).then(({data, error}) => {
  console.log(data, error)
})
