import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PDF生成とダウンロード
export async function POST(request: NextRequest) {
  try {
    const { work_request_id } = await request.json();

    if (!work_request_id) {
      return NextResponse.json({ error: 'work_request_id is required' }, { status: 400 });
    }

    // 作業依頼書データと関連する予定データを取得
    const { data: workRequest, error } = await supabase
      .from('work_requests')
      .select(`
        *,
        tasks (
          *,
          users!tasks_user_id_fkey (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', work_request_id)
      .single();

    if (error || !workRequest) {
      console.error('Error fetching work request:', error);
      return NextResponse.json({ error: 'Work request not found' }, { status: 404 });
    }

    // PDF生成処理（後で詳細実装）
    const pdf = new jsPDF();

    // 基本情報をPDFに追加
    pdf.text('作業依頼書', 20, 20);
    pdf.text(`日時: ${new Date(workRequest.tasks.start_datetime).toLocaleDateString('ja-JP')}`, 20, 40);
    pdf.text(`現場名: ${workRequest.tasks.site_name}`, 20, 60);
    pdf.text(`得意先: ${workRequest.tasks.customer_name}`, 20, 80);

    // PDFをBuffer形式で生成
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // レスポンスヘッダーを設定してPDFを返す
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="work-request-${work_request_id}.pdf"`
      }
    });

  } catch (error) {
    console.error('Unexpected error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}