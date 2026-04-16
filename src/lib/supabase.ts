import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (supabaseUrl === 'https://placeholder-project.supabase.co') {
  console.error("CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your hosting dashboard.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
