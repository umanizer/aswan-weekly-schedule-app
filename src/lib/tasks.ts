import { supabase, Task, handleSupabaseError } from './supabase';

// 予定の取得（週間）
export const fetchTasksForWeek = async (startDate: Date, endDate: Date) => {
  try {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        users (
          id,
          full_name,
          role
        )
      `)
      .gte('start_datetime', startISO)
      .lte('start_datetime', endISO)
      .order('start_datetime', { ascending: true });

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { data: [], error: handleSupabaseError(error) };
  }
};

// セッション確認付きでAPIトークンを取得
const getValidatedSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    console.log('No valid session, attempting refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError || !refreshData.session) {
      throw new Error('認証セッションの取得・更新に失敗しました');
    }

    console.log('Session refreshed for API call');
    return refreshData.session;
  }

  // セッションが間もなく期限切れの場合、リフレッシュ
  const expiresAt = session.expires_at || 0;
  const now = Date.now() / 1000;
  const timeLeft = expiresAt - now;

  if (timeLeft < 300) { // 5分以内に期限切れの場合
    console.log('Session expires soon, refreshing...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError || !refreshData.session) {
      console.log('Refresh failed, using existing session');
      return session;
    }

    return refreshData.session;
  }

  return session;
};

// 全予定の取得（APIエンドポイント経由、セッション確認付き）
export const fetchAllTasks = async () => {
  console.log('=== fetchAllTasks via API ===');

  try {
    // セッションの確認とリフレッシュ
    const session = await getValidatedSession();

    const response = await fetch('/api/tasks', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API error response:', errorData);

      // 401エラーの場合、セッション問題の可能性
      if (response.status === 401) {
        throw new Error('認証エラー: ページを再読み込みしてください');
      }

      throw new Error(errorData.error || `API エラー (${response.status})`);
    }

    const responseData = await response.json();
    console.log('Tasks fetched via API, count:', responseData.data?.length || 0);

    // 各タスクのユーザー情報をチェック
    if (responseData.data && responseData.data.length > 0) {
      responseData.data.forEach((task: any, index: number) => {
        console.log(`Task ${index + 1}:`, {
          id: task.id,
          customer_name: task.customer_name,
          user_id: task.user_id,
          users: task.users
        });
      });
    }

    return { data: responseData.data || [], error: null };
  } catch (error: any) {
    console.error('Error in fetchAllTasks:', error);
    return { data: [], error: error.message };
  }
};

// 予定の新規作成
export const createTask = async (taskData: Partial<Task>) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select(`
        *,
        users (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating task:', error);
    return { data: null, error: handleSupabaseError(error) };
  }
};

// 予定の更新
export const updateTask = async (taskId: number, updates: Partial<Task>) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        users (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating task:', error);
    return { data: null, error: handleSupabaseError(error) };
  }
};

// 予定の削除
export const deleteTask = async (taskId: number) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { error: handleSupabaseError(error) };
  }
};

// ユーザー別予定の取得
export const fetchUserTasks = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        users (
          id,
          full_name,
          role
        )
      `)
      .eq('user_id', userId)
      .order('start_datetime', { ascending: true });

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return { data: [], error: handleSupabaseError(error) };
  }
};

// 日付範囲の予定統計を取得
export const getTasksStats = async (startDate: Date, endDate: Date) => {
  try {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .select('transport_method')
      .gte('start_datetime', startISO)
      .lte('start_datetime', endISO);

    if (error) {
      throw error;
    }

    // 統計を計算
    const stats = {
      total: data.length,
      mBin: data.filter(task => task.transport_method === 'エムワーク便').length,
      otherBin: data.filter(task => task.transport_method === '別便').length,
      staffOnly: data.filter(task => task.transport_method === '人員のみ').length,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching tasks stats:', error);
    return { 
      data: { total: 0, mBin: 0, otherBin: 0, staffOnly: 0 }, 
      error: handleSupabaseError(error) 
    };
  }
};

// 特定日付のM便予定を取得（時間重複チェック用）
export const fetchMBinTasksForDate = async (date: Date, excludeTaskId?: number) => {
  try {
    // 日本時間での日付範囲を作成
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // 日本時間での開始・終了時刻を作成
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    // 日本時間（JST）からUTCに変換してISO文字列に
    const startISO = new Date(startOfDay.getTime() - (9 * 60 * 60 * 1000)).toISOString();
    const endISO = new Date(endOfDay.getTime() - (9 * 60 * 60 * 1000)).toISOString();

    let query = supabase
      .from('tasks')
      .select('id, start_datetime, end_datetime, transport_method')
      .in('transport_method', ['M便', 'エムワーク便'])
      .gte('start_datetime', startISO)
      .lte('start_datetime', endISO);

    // 編集時は自分の予定を除外
    if (excludeTaskId) {
      query = query.neq('id', excludeTaskId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching M-bin tasks for date:', error);
    return { data: [], error: handleSupabaseError(error) };
  }
};