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
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Step 1: Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({
        error: 'Auth failed',
        authError: authError?.message
      }, { status: 401 });
    }

    // Step 2: Try direct query with normal client (should hang)
    console.log('Testing direct user query...');
    let directQueryResult = null;
    let directQueryError = null;

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Direct query timeout')), 3000)
      );

      const directPromise = supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data, error } = await Promise.race([directPromise, timeoutPromise]);
      directQueryResult = data;
      directQueryError = error?.message;
    } catch (error: any) {
      directQueryError = error.message;
    }

    // Step 3: Try with Service Role (should work)
    console.log('Testing Service Role query...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      directQuery: {
        success: !!directQueryResult && !directQueryError,
        error: directQueryError,
        data: directQueryResult
      },
      serviceRoleQuery: {
        success: !!adminData && !adminError,
        error: adminError?.message,
        data: adminData ? {
          id: adminData.id,
          full_name: adminData.full_name,
          role: adminData.role
        } : null
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}