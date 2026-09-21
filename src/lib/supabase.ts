import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

// This client uses the Anon key. It should be used for client-side operations
// and relies on Row Level Security (RLS) policies in Supabase.
// Fallback to placeholder if url or key is missing or empty
const finalUrl = supabaseUrl && supabaseUrl.trim() !== '' ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey && supabaseAnonKey.trim() !== '' ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(finalUrl, finalKey);
