import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 通常のSupabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Service Role用のSupabaseクライアント
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

export async function GET(request: NextRequest) {
  console.log('=== DB Connection Test ===');

  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    }
  };

  // Test 1: Basic connection test
  try {
    console.log('Test 1: Basic connection test');
    const start1 = Date.now();
    const { data: pingData, error: pingError } = await supabaseAdmin
      .from('users')
      .select('count(*)')
      .limit(1);

    const duration1 = Date.now() - start1;

    results.tests.push({
      name: 'Basic Connection (Service Role)',
      success: !pingError,
      duration: duration1,
      error: pingError?.message || null,
      data: pingData
    });

    console.log('Test 1 result:', { success: !pingError, duration: duration1 });
  } catch (error: any) {
    results.tests.push({
      name: 'Basic Connection (Service Role)',
      success: false,
      error: error.message,
      duration: 0
    });
  }

  // Test 2: Simple user count with timeout
  try {
    console.log('Test 2: User count with timeout');
    const start2 = Date.now();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout (5s)')), 5000)
    );

    const queryPromise = supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    const { data: countData, error: countError } = await Promise.race([queryPromise, timeoutPromise]);
    const duration2 = Date.now() - start2;

    results.tests.push({
      name: 'User Count with Timeout',
      success: !countError,
      duration: duration2,
      error: countError?.message || null,
      count: countData?.length || 0
    });

    console.log('Test 2 result:', { success: !countError, duration: duration2 });
  } catch (error: any) {
    results.tests.push({
      name: 'User Count with Timeout',
      success: false,
      error: error.message,
      duration: 5000
    });
  }

  // Test 3: Specific user lookup
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    try {
      console.log('Test 3: User lookup with auth');
      const start3 = Date.now();
      const token = authHeader.replace('Bearer ', '');

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (user && !authError) {
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        const duration3 = Date.now() - start3;

        results.tests.push({
          name: 'Authenticated User Lookup',
          success: !userError,
          duration: duration3,
          error: userError?.message || null,
          userData: userData ? { id: userData.id, full_name: userData.full_name, role: userData.role } : null
        });

        console.log('Test 3 result:', { success: !userError, duration: duration3 });
      } else {
        results.tests.push({
          name: 'Authenticated User Lookup',
          success: false,
          error: 'Auth failed: ' + (authError?.message || 'No user'),
          duration: Date.now() - start3
        });
      }
    } catch (error: any) {
      results.tests.push({
        name: 'Authenticated User Lookup',
        success: false,
        error: error.message,
        duration: 0
      });
    }
  }

  return NextResponse.json(results);
}