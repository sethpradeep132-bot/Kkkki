const { loadEnv } = require('vite');
const env = loadEnv('production', process.cwd(), '');
console.log(env.VITE_SUPABASE_URL);
