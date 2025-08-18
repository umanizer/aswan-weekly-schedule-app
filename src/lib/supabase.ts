import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 環境変数の存在確認（デバッグ用）
console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  fullUrl: supabaseUrl,
  fullKey: supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseAnonKey?.length
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing required Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// データベースの型定義
export interface User {
  id: string;
  full_name: string;
  role: 'admin' | 'user';
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  user_id: string;
  customer_name: string;
  start_datetime: string;
  end_datetime?: string;
  site_name: string;
  site_address: string;
  goods_description: string;
  is_staff_accompanied: boolean;
  has_part_timer?: boolean;
  part_timer_count?: number;
  part_timer_duration?: string;
  transport_method: string;
  transport_categories?: {
    aswan: boolean;
    charter: boolean;
    charterCount?: number;
    shippingCompany: boolean;
    selectedCompany?: string;
    customCompany?: string;
    branchName?: string;
    noPickup: boolean;
  };
  remarks?: string;
  created_at: string;
  updated_at: string;
  // usersテーブルとのJOIN用
  users?: User;
}

// 認証関連の型定義
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

// Supabaseエラーハンドリング
export const handleSupabaseError = (error: unknown) => {
  console.error('Supabase Error:', error);
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'データベースエラーが発生しました';
};