import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcuvbfenbiddexcpxcbh.supabase.co';
const supabaseAnonKey = 'sb_publishable_Mi7uM5_Ng7Vv_g2J4QlW0g_4QB23leg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
