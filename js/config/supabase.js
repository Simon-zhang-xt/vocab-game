/**
 * Supabase Configuration
 */

const SUPABASE_URL = 'https://pzksoyntzzygfcbvchxr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nVljbFV4IYq0p3zgPTWbSw_SB8ZbpYU';

// 初始化Supabase客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
