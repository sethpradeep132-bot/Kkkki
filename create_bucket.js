const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  const { data, error } = await supabase.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 10485760,
  });
  if (error && error.message !== 'The resource already exists') {
    console.error("Error creating bucket:", error);
  } else {
    console.log("Bucket created or already exists:", data);
  }
}
setup();
