import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] Wine store status API called');
    
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
    
    if (authError || !user) {
      console.error('❌ [API] Not authenticated:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use admin client to fetch wine store status (bypasses RLS)
    if (!supabaseAdmin) {
      console.error('❌ [API] Admin client not available');
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    console.log('🔍 [API] Fetching wine store status');
    
    const { data: setting, error: settingError } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'wine_store_disabled')
      .single();

    if (settingError) {
      console.error('❌ [API] Error fetching wine store status:', settingError);
      return NextResponse.json({ error: 'Failed to fetch wine store status' }, { status: 500 });
    }

    const isDisabled = setting?.value === 'true';
    
    const response = { 
      isDisabled: isDisabled,
      status: isDisabled ? 'disabled' : 'enabled'
    };
    
    console.log('✅ [API] Returning wine store status:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [API] Error in wine store status API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 [API] Wine store status update API called');
    
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
    
    if (authError || !user) {
      console.error('❌ [API] Not authenticated:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { isDisabled } = body;

    if (typeof isDisabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Use admin client to update wine store status (bypasses RLS)
    if (!supabaseAdmin) {
      console.error('❌ [API] Admin client not available');
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    console.log('🔍 [API] Updating wine store status to:', isDisabled);
    
    const newValue = isDisabled ? 'true' : 'false';
    
    const { error: updateError } = await supabaseAdmin
      .from('app_settings')
      .update({ 
        value: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'wine_store_disabled');

    if (updateError) {
      console.error('❌ [API] Error updating wine store status:', updateError);
      return NextResponse.json({ error: 'Failed to update wine store status' }, { status: 500 });
    }

    const response = { 
      isDisabled: isDisabled,
      status: isDisabled ? 'disabled' : 'enabled',
      message: `Wine store has been ${isDisabled ? 'disabled' : 'enabled'} successfully`
    };
    
    console.log('✅ [API] Wine store status updated:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [API] Error in wine store status update API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

