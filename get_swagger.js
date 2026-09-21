import dotenv from 'dotenv';
dotenv.config();
fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`)
.then(r => r.json())
.then(d => {
  console.log(JSON.stringify(d).substring(0, 500));
  const str = JSON.stringify(d);
  const idx = str.indexOf('added_pincode');
  if (idx > -1) {
    console.log(str.substring(idx - 100, idx + 500));
  } else {
    console.log('Not found');
  }
});
