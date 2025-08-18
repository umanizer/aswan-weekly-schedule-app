import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req: Request) => {
  try {
    console.log('Notification function called');
    
    // CORS ヘッダーを設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // OPTIONS リクエストの処理
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // POST以外のメソッドを拒否
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // リクエストボディを取得
    const data: TaskNotificationData = await req.json();
    console.log('Request data:', data);

    // 環境変数の確認
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const notificationEmails = Deno.env.get('NOTIFICATION_EMAILS');
    
    console.log('Environment check:', {
      hasResendKey: !!resendApiKey,
      hasNotificationEmails: !!notificationEmails,
      resendKeyLength: resendApiKey?.length || 0
    });

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    if (!notificationEmails) {
      throw new Error('NOTIFICATION_EMAILS environment variable is not set');
    }

    // 通知する人のメールアドレスリスト
    const emails = notificationEmails.split(',').map(email => email.trim());
    console.log('Notification emails:', emails);

    // アクションの日本語化
    const actionText = {
      created: '新規登録',
      updated: '更新', 
      deleted: '削除'
    }[data.type];

    // 日時フォーマット
    const formatDateTime = (datetime: string) => {
      const date = new Date(datetime);
      return date.toLocaleString('ja-JP', { 
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const startTime = formatDateTime(data.task.start_datetime);
    const endTime = data.task.end_datetime ? formatDateTime(data.task.end_datetime) : '';

    // メール件名
    const subject = `【予定${actionText}】${data.task.customer_name} - ${data.task.site_name}`;

    // メール本文
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">予定が${actionText}されました</h2>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555;">予定詳細</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">得意先名:</td>
              <td style="padding: 8px 0;">${data.task.customer_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">現場名:</td>
              <td style="padding: 8px 0;">${data.task.site_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">現場住所:</td>
              <td style="padding: 8px 0;">${data.task.site_address}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">開始時刻:</td>
              <td style="padding: 8px 0;">${startTime}</td>
            </tr>
            ${endTime ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">終了時刻:</td>
              <td style="padding: 8px 0;">${endTime}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">運送区分:</td>
              <td style="padding: 8px 0;">${data.task.transport_method}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">担当者:</td>
              <td style="padding: 8px 0;">${data.task.user_name}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          この通知は週間予定管理システムから自動送信されています。
        </p>
      </div>
    `;

    // Resend APIでメール送信
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@resend.dev',
        to: emails,
        subject: subject,
        html: htmlContent,
      }),
    });

    console.log('Resend response status:', resendResponse.status);

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const resendData = await resendResponse.json();
    console.log('Resend success:', resendData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        emailsSent: emails.length,
        resendId: resendData.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Notification function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});