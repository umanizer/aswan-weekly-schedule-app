import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 作業依頼書の作成
export async function POST(request: NextRequest) {
  try {
    const {
      task_id,
      user_id,
      meeting_time,
      meeting_place,
      customer_contact_person,
      customer_phone,
      work_content,
      equipment,
      cart_count,
      abacus_count,
      material_loading,
      additional_remarks
    } = await request.json();

    const { data, error } = await supabase
      .from('work_requests')
      .insert({
        task_id,
        user_id,
        meeting_time,
        meeting_place,
        customer_contact_person,
        customer_phone,
        work_content,
        equipment,
        cart_count,
        abacus_count,
        material_loading,
        additional_remarks
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 作業依頼書の取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const task_id = searchParams.get('task_id');

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
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
      .eq('task_id', task_id)
      .single();

    if (error) {
      console.error('Error fetching work request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}