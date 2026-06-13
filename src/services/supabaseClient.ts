import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL = 'https://cqhyzsdmqdgslfuoeuzf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RCT85sv6alfqQ-FbnXpOLw_3Wm2reVx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
