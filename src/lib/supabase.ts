import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcuvbfenbiddexcpxcbh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjdXZiZmVuYmlkZGV4Y3B4Y2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDMxMjMsImV4cCI6MjA2NzU3OTEyM30.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
