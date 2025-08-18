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

// 管理者権限チェック（セキュア版）
async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { isAdmin: false, userId: null };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // 無効なトークンの場合は拒否
  if (!token || token === 'null' || token === 'undefined') {
    return { isAdmin: false, userId: null };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { isAdmin: false, userId: null };
    }

    // ユーザーの役割を確認
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return { isAdmin: false, userId: user.id };
    }

    return {
      isAdmin: userProfile.role === 'admin',
      userId: user.id
    };
  } catch (error) {
    console.error('Error in checkAdminAuth:', error);
    return { isAdmin: false, userId: null };
  }
}

// GET: 全ユーザー取得
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkAdminAuth(request);
  
  if (!isAdmin) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
  }
}

// POST: 新規ユーザー作成
export async function POST(request: NextRequest) {
  const { isAdmin } = await checkAdminAuth(request);
  
  if (!isAdmin) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  try {
    const userData = await request.json();
    const { email, password, full_name, role } = userData;

    // セキュリティ: メールアドレスをログに出力しない

    // 1. まず Supabase Auth にユーザーを作成
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // メール確認をスキップ
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      throw new Error(`認証ユーザー作成に失敗しました: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('認証ユーザーの作成に失敗しました');
    }

    console.log('Auth user created successfully:', authUser.user.id);

    try {
      // 2. usersテーブルにプロフィール情報を追加
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authUser.user.id,
          full_name: full_name,
          email: email,
          role: role,
        }])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        
        // プロフィール作成に失敗した場合、認証ユーザーを削除してロールバック
        console.log('Rolling back auth user creation...');
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        
        throw new Error(`プロフィール作成に失敗しました: ${profileError.message}`);
      }

      console.log('User created successfully:', profileData);
      return NextResponse.json({ data: profileData });

    } catch (profileError: any) {
      // プロフィール作成でエラーが発生した場合、認証ユーザーを削除
      console.log('Cleaning up auth user due to profile error...');
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      } catch (deleteError) {
        console.error('Failed to cleanup auth user:', deleteError);
      }
      throw profileError;
    }

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: error.message || 'ユーザー作成に失敗しました' 
    }, { status: 500 });
  }
}

// PUT: ユーザー情報更新
export async function PUT(request: NextRequest) {
  const { isAdmin } = await checkAdminAuth(request);
  
  if (!isAdmin) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  try {
    const { userId, updates } = await request.json();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: error.message || 'ユーザー更新に失敗しました' 
    }, { status: 500 });
  }
}

// DELETE: ユーザー削除
export async function DELETE(request: NextRequest) {
  const { isAdmin } = await checkAdminAuth(request);
  
  if (!isAdmin) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    console.log('Deleting user:', userId);

    // 1. まずusersテーブルから削除
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Profile deletion failed:', profileError);
      throw new Error(`プロフィール削除に失敗しました: ${profileError.message}`);
    }

    // 2. 次にSupabase Authからユーザーを削除
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth user deletion failed:', authError);
      // Auth削除に失敗してもプロフィールは既に削除されているので、警告のみ
      console.warn('認証ユーザーの削除に失敗しましたが、プロフィールは削除されました:', authError.message);
    }

    console.log('User deleted successfully:', userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: error.message || 'ユーザー削除に失敗しました' 
    }, { status: 500 });
  }
}