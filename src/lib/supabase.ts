import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. If you are developing locally, you MUST restart your Vite server so it picks up the .env file. If you are on Vercel/Netlify, you MUST add these variables to your deployment dashboard.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
