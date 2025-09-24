import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Service Role用のSupabaseクライアント（サーバーサイドのみ）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET: 現在のユーザープロフィール取得
export async function GET(request: NextRequest) {
  console.log('=== GET /api/users/profile ===');

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // トークンからユーザーを取得
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Service Roleを使用してユーザープロフィールを取得
    const { data, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    console.log('Profile fetched successfully:', data.full_name);

    return NextResponse.json({
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      created_at: data.created_at,
      updated_at: data.updated_at
    });

  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}