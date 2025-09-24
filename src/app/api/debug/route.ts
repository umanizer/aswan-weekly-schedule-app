import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG API ===');

    // 1. usersテーブルの確認
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .limit(5);

    if (usersError) {
      console.error('Users query error:', usersError);
    } else {
      console.log('Users data:', users);
    }

    // 2. tasksテーブルの確認（ユーザー情報なし）
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, user_id, customer_name, start_datetime')
      .limit(5);

    if (tasksError) {
      console.error('Tasks query error:', tasksError);
    } else {
      console.log('Tasks data:', tasks);
    }

    // 3. JOINクエリの確認
    const { data: tasksWithUsers, error: joinError } = await supabase
      .from('tasks')
      .select(`
        id,
        user_id,
        customer_name,
        start_datetime,
        users (
          id,
          full_name,
          role
        )
      `)
      .limit(5);

    if (joinError) {
      console.error('JOIN query error:', joinError);
    } else {
      console.log('Tasks with users data:', tasksWithUsers);
    }

    return NextResponse.json({
      users: users || [],
      tasks: tasks || [],
      tasksWithUsers: tasksWithUsers || [],
      errors: {
        users: usersError?.message || null,
        tasks: tasksError?.message || null,
        join: joinError?.message || null
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Debug API failed' }, { status: 500 });
  }
}