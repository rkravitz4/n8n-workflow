import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] User role API called');
    
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

    console.log('🔍 [API] Created server client, getting user from session');
    
    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 [API] User session result:', { 
      hasUser: !!user, 
      hasError: !!authError, 
      userEmail: user?.email,
      userId: user?.id,
      errorMessage: authError?.message 
    });
    
    if (authError || !user) {
      console.error('❌ [API] Not authenticated:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use admin client to fetch role (bypasses RLS)
    if (!supabaseAdmin) {
      console.error('❌ [API] Admin client not available');
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    console.log('🔍 [API] Fetching profile for user:', user.id);
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('🔍 [API] Profile fetch result:', { 
      hasProfile: !!profile, 
      hasError: !!profileError, 
      role: profile?.role,
      errorMessage: profileError?.message 
    });

    if (profileError) {
      console.error('❌ [API] Error fetching user role:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
    }

    const response = { 
      role: profile?.role || null,
      userId: user.id 
    };
    
    console.log('✅ [API] Returning user role:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [API] Error in user role API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
