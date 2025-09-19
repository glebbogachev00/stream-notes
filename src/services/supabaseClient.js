import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

export const getSupabaseClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'stream-auth',
      autoRefreshToken: true,
      detectSessionInUrl: false,
      // Keep users logged in for days
      expiryMargin: 1800, // Start refreshing 30 minutes before expiry (more aggressive)
      storage: window.localStorage,
      debug: false // Set to true if you need to debug auth issues
    }
  });

  return cachedClient;
};
