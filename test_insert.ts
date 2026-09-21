import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const fakeAddress = "123 AI Auto Gen Street, Mumbai";
             const fakePincode = "400001";
             const fakeBank = "123456789012";
             const fakeIfsc = "HDFC0001234";
             const fakeUpi = "ai@upi";
             const fakeAadhar = "123456789012";
             const fakePan = "ABCDE1234F";
             
  const payload = { 
                  rider_name: 'AI Generated Rider', 
                  registered_mobile_number: '9999999999', 
                  registered_email: 'rider@ai.com', 
                  password: 'password123',
                  registered_full_address: fakeAddress,
                  registered_pincode: fakePincode,
                  vehicle_no: 'MH01AB1234',
                  driving_licence: 'MH1234567890123',
                  aadhaar_card: fakeAadhar,
                  pan_card: fakePan,
                  bank_name: 'HDFC Bank',
                  account_no: fakeBank,
                  ifsc_code: fakeIfsc,
                  upi_id: fakeUpi
               };
  const { data, error } = await supabase.from('riders').insert([payload]);
  console.log("Insert result:", { data, error });
}
test();
