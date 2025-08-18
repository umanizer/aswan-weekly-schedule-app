import { supabase } from './supabase';

interface TaskNotificationData {
  type: 'created' | 'updated' | 'deleted';
  task: {
    id: number;
    customer_name: string;
    start_datetime: string;
    end_datetime?: string;
    site_name: string;
    site_address: string;
    transport_method: string;
    user_name: string;
  };
  user_name: string;
}

/**
 * 予定変更通知を送信する
 */
export const sendTaskNotification = async (data: TaskNotificationData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('通知機能テスト開始:', data.type, data.task.customer_name);
    
    // まず環境変数をテスト
    console.log('環境変数テスト中...');
    const { data: envResponse, error: envError } = await supabase.functions.invoke('test-env', {
      body: {},
    });

    if (envError) {
      console.error('Environment test error:', envError);
    } else {
      console.log('Environment test result:', envResponse);
    }
    
    // 環境変数を再確認
    console.log('Re-checking environment variables...');
    const { data: envCheck, error: envCheckError } = await supabase.functions.invoke('check-env', {
      body: {},
    });
    
    if (!envCheckError) {
      console.log('Latest environment variables:', envCheck);
    }
    
    // 通知機能を呼び出し
    console.log('Sending notification...');
    const { data: response, error } = await supabase.functions.invoke('send-task-notification', {
      body: data,
    });

    if (error) {
      console.error('Edge Function error details:', {
        message: error.message,
        stack: error.stack,
        details: error.details,
        context: error.context,
        fullError: error
      });
      
      // Responseオブジェクトがある場合、内容を取得してみる
      if (error.context && error.context instanceof Response) {
        try {
          const errorText = await error.context.text();
          console.error('Edge Function response text:', errorText);
        } catch (textError) {
          console.error('Failed to read response text:', textError);
        }
      }
      
      return { success: false, error: error.message };
    }

    // レスポンスも詳細ログ
    if (response && response.error) {
      console.error('Edge Function response error:', response);
      return { success: false, error: response.details || response.error };
    }

    console.log('Notification sent successfully:', response);
    return { success: true };
  } catch (error) {
    console.error('Failed to send notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * 予定作成時の通知
 */
export const notifyTaskCreated = async (task: any, userName: string) => {
  return await sendTaskNotification({
    type: 'created',
    task: {
      id: task.id,
      customer_name: task.customer_name,
      start_datetime: task.start_datetime,
      end_datetime: task.end_datetime,
      site_name: task.site_name,
      site_address: task.site_address,
      transport_method: task.transport_method,
      user_name: userName,
    },
    user_name: userName,
  });
};

/**
 * 予定更新時の通知
 */
export const notifyTaskUpdated = async (task: any, userName: string) => {
  return await sendTaskNotification({
    type: 'updated',
    task: {
      id: task.id,
      customer_name: task.customer_name,
      start_datetime: task.start_datetime,
      end_datetime: task.end_datetime,
      site_name: task.site_name,
      site_address: task.site_address,
      transport_method: task.transport_method,
      user_name: userName,
    },
    user_name: userName,
  });
};

/**
 * 予定削除時の通知
 */
export const notifyTaskDeleted = async (task: any, userName: string) => {
  return await sendTaskNotification({
    type: 'deleted',
    task: {
      id: task.id,
      customer_name: task.customer_name,
      start_datetime: task.start_datetime,
      end_datetime: task.end_datetime,
      site_name: task.site_name,
      site_address: task.site_address,
      transport_method: task.transport_method,
      user_name: userName,
    },
    user_name: userName,
  });
};