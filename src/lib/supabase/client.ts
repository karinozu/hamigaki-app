import { createClient } from '@supabase/supabase-js';

// 環境変数が未設定の場合はダミー値でクライアントを生成（ビルドエラー防止）
// 実際のDB保存はbrush/page.tsxのtry/catchで安全にスキップされる
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
