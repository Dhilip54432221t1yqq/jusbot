import '../config/env.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] Missing environment variables (SUPABASE_URL or SUPABASE_ANON_KEY).');
}

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseKey || 'placeholder');
export default supabase;
