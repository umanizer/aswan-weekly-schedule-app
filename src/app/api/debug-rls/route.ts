import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  console.log('=== RLS Debug Test ===');

  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    tests: [] as any[]
  };

  // Test 1: Service Role - User Count
  try {
    console.log('Test 1: Service Role user count');
    const start1 = Date.now();

    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, role')
      .limit(5);

    const duration1 = Date.now() - start1;

    results.tests.push({
      name: 'Service Role - Users Query',
      success: !adminError,
      duration: duration1,
      error: adminError?.message || null,
      count: adminUsers?.length || 0,
      sampleData: adminUsers?.slice(0, 2) || []
    });

    console.log('Test 1 result:', { success: !adminError, duration: duration1, count: adminUsers?.length });
  } catch (error: any) {
    results.tests.push({
      name: 'Service Role - Users Query',
      success: false,
      error: error.message,
      duration: 0
    });
  }

  // Test 2: Normal Client without auth - Should fail or timeout
  try {
    console.log('Test 2: Normal client without auth (should timeout)');
    const start2 = Date.now();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Normal client timeout (3s)')), 3000)
    );

    const queryPromise = supabase
      .from('users')
      .select('id, full_name')
      .limit(1);

    const { data: normalUsers, error: normalError } = await Promise.race([queryPromise, timeoutPromise]);
    const duration2 = Date.now() - start2;

    results.tests.push({
      name: 'Normal Client - Users Query (No Auth)',
      success: !normalError,
      duration: duration2,
      error: normalError?.message || null,
      count: normalUsers?.length || 0
    });

    console.log('Test 2 result:', { success: !normalError, duration: duration2 });
  } catch (error: any) {
    results.tests.push({
      name: 'Normal Client - Users Query (No Auth)',
      success: false,
      error: error.message,
      duration: Date.now() - Date.now()
    });
  }

  // Test 3: Check RLS policies
  try {
    console.log('Test 3: Check RLS policies');
    const start3 = Date.now();

    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');

    const duration3 = Date.now() - start3;

    results.tests.push({
      name: 'RLS Policies Check',
      success: !policyError,
      duration: duration3,
      error: policyError?.message || null,
      policies: policies || []
    });

    console.log('Test 3 result:', { success: !policyError, policyCount: policies?.length });
  } catch (error: any) {
    results.tests.push({
      name: 'RLS Policies Check',
      success: false,
      error: error.message,
      duration: 0
    });
  }

  return NextResponse.json(results);
}