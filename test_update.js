import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  const email = "vijayraz1234@gmail.com";
  const password = "newpassword123";
  const user_metadata = { role: "admin" };
  
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email
  });
  
  if (linkData?.user?.id) {
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      linkData.user.id,
      { password, user_metadata }
    );
    console.log("Update Data:", updateData.user?.email);
    console.log("Update Error:", updateError);
  }
}
test();
