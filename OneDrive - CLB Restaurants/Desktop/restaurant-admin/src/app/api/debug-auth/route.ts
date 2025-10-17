import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Debug auth endpoint called');
    
    // Create server client with cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      authError: authError?.message,
      cookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAdminClient: !!supabaseAdmin,
    };

    console.log('🔍 [DEBUG] Debug info:', debugInfo);

    if (user && supabaseAdmin) {
      // Try to fetch role
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      debugInfo.profile = {
        hasProfile: !!profile,
        role: profile?.role,
        error: profileError?.message,
      };
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('❌ [DEBUG] Error in debug auth:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
