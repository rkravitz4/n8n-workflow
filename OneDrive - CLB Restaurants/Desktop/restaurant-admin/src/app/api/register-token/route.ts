import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const { userId, pushToken } = await request.json();

    // Validate required fields
    if (!userId || !pushToken) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, pushToken' 
      }, { status: 400 });
    }

    // Validate push token format
    if (!pushToken.startsWith('ExponentPushToken[')) {
      return NextResponse.json({ 
        error: 'Invalid push token format. Expected ExponentPushToken[...]' 
      }, { status: 400 });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Insert or update push token
    const { data, error } = await supabaseAdmin
      .from('user_tokens')
      .upsert([{
        user_id: userId,
        expo_push_token: pushToken,
        role: user.role,
        notification_enabled: true,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering push token:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Push token registered successfully',
      token: data
    });

  } catch (error) {
    console.error('Error in register token API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
