import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (supabaseUrl === 'https://placeholder-project.supabase.co') {
  // Intentional demo/no-backend fallback (see CLAUDE.md) — a missing env var at
  // build time is a configuration warning, not a runtime error. Using
  // console.warn keeps the diagnostic without tripping Lighthouse's
  // errors-in-console audit (and without falsely signalling a broken page).
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — using placeholder (demo/no-backend mode).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
