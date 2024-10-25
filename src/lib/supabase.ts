// lib/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
    if (!supabase) {
      const supabaseUrl = window.__RUNTIME_CONFIG__.SUPABASE_URL;
      const supabaseAnonKey = window.__RUNTIME_CONFIG__.SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
      } else {
        console.warn('Supabase URL or Anon Key is missing in runtime config.');
      }
    }
    return supabase;
  }
  return null;
};

export { supabase };
