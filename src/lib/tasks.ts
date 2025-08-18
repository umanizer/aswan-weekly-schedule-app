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

// 全予定の取得
export const fetchAllTasks = async () => {
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
      .order('start_datetime', { ascending: true });

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    return { data: [], error: handleSupabaseError(error) };
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
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

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