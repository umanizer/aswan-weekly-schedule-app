import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// 通常のSupabaseクライアント（権限チェック用）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 認証チェック
async function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { isAuthenticated: false, userId: null };
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token || token === 'null' || token === 'undefined') {
    return { isAuthenticated: false, userId: null };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { isAuthenticated: false, userId: null };
    }

    return { isAuthenticated: true, userId: user.id };
  } catch (error) {
    console.error('Error in checkAuth:', error);
    return { isAuthenticated: false, userId: null };
  }
}

// GET: 全タスク取得（ユーザー情報込み）
export async function GET(request: NextRequest) {
  console.log('=== GET /api/tasks ===');

  const { isAuthenticated, userId } = await checkAuth(request);

  if (!isAuthenticated) {
    console.log('Authentication failed');
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  console.log('User authenticated:', userId);

  try {
    // Service Role を使用してRLSを回避し、すべてのタスクとユーザー情報を取得
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        users (
          id,
          full_name,
          role
        )
      `)
      .order('start_datetime', { ascending: true });

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    console.log('Tasks fetched successfully, count:', data?.length || 0);

    // デバッグ：最初のタスクのユーザー情報
    if (data && data.length > 0) {
      console.log('First task user info:', {
        user_id: data[0].user_id,
        users: data[0].users
      });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'タスクの取得に失敗しました' }, { status: 500 });
  }
}