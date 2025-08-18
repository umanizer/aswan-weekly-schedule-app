import { supabase } from './supabase';

// 通知データの型定義
export interface NotificationItem {
  id: number;
  task_id: number | null;
  action_type: 'created' | 'updated' | 'deleted';
  task_data: {
    customer_name: string;
    site_name: string;
    start_datetime: string;
    end_datetime?: string;
    transport_method: string;
  };
  user_name: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

// 通知統計の型定義
export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
}

/**
 * 通知一覧を取得する
 */
export const fetchNotifications = async (limit: number = 20): Promise<{ data: NotificationItem[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('task_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Notifications fetch error:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching notifications:', error);
    return { data: [], error };
  }
};

/**
 * 新しい通知の数を取得する（過去24時間以内）
 */
export const fetchUnreadNotificationCount = async (): Promise<{ count: number; error: any }> => {
  try {
    // 過去24時間以内の通知を「未読」とみなす
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { count, error } = await supabase
      .from('task_notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    if (error) {
      console.error('Unread notification count error:', error);
      return { count: 0, error };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Unexpected error fetching unread count:', error);
    return { count: 0, error };
  }
};

/**
 * 通知統計を取得する
 */
export const fetchNotificationStats = async (): Promise<{ stats: NotificationStats; error: any }> => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // 全通知数
    const { count: totalCount, error: totalError } = await supabase
      .from('task_notifications')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      return { stats: { total: 0, unread: 0, today: 0 }, error: totalError };
    }

    // 今日の通知数
    const { count: todayCount, error: todayError } = await supabase
      .from('task_notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    if (todayError) {
      return { stats: { total: totalCount || 0, unread: 0, today: 0 }, error: todayError };
    }

    // 未読通知数（過去24時間）
    const { count: unreadCount, error: unreadError } = await supabase
      .from('task_notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    if (unreadError) {
      return { 
        stats: { total: totalCount || 0, unread: 0, today: todayCount || 0 }, 
        error: unreadError 
      };
    }

    return { 
      stats: { 
        total: totalCount || 0, 
        unread: unreadCount || 0, 
        today: todayCount || 0 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Unexpected error fetching notification stats:', error);
    return { stats: { total: 0, unread: 0, today: 0 }, error };
  }
};

/**
 * 通知を既読にマークする（実際にはローカルストレージで管理）
 */
export const markNotificationsAsRead = (): void => {
  try {
    const now = new Date().toISOString();
    localStorage.setItem('lastNotificationReadTime', now);
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
  }
};

/**
 * 最後に通知を読んだ時刻を取得する
 */
export const getLastReadTime = (): Date | null => {
  try {
    const lastReadTime = localStorage.getItem('lastNotificationReadTime');
    return lastReadTime ? new Date(lastReadTime) : null;
  } catch (error) {
    console.error('Failed to get last read time:', error);
    return null;
  }
};

/**
 * 未読通知があるかチェックする
 */
export const hasUnreadNotifications = async (): Promise<boolean> => {
  try {
    const lastReadTime = getLastReadTime();
    if (!lastReadTime) {
      // 初回の場合は過去24時間の通知があれば未読とする
      const { count } = await fetchUnreadNotificationCount();
      return count > 0;
    }

    const { count, error } = await supabase
      .from('task_notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastReadTime.toISOString());

    if (error) {
      console.error('Error checking unread notifications:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Unexpected error checking unread notifications:', error);
    return false;
  }
};