import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationService } from '@/lib/pushNotificationService';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const { targetAudience = 'all' } = await request.json();

    // Get current tokens for debugging
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('user_tokens')
      .select('*')
      .eq('notification_enabled', true);

    if (tokensError) {
      return NextResponse.json({ error: tokensError.message }, { status: 500 });
    }

    // Send test notification
    const result = await pushNotificationService.sendNotification({
      title: 'Test Notification',
      message: 'This is a test push notification from the webapp.',
      targetAudience: targetAudience as 'all' | 'admins' | 'users',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      result,
      tokensFound: tokens?.length || 0,
      tokens: tokens?.map(t => ({
        id: t.id,
        user_id: t.user_id,
        role: t.role,
        notification_enabled: t.notification_enabled,
        token_preview: t.expo_push_token?.substring(0, 20) + '...'
      }))
    });

  } catch (error) {
    console.error('Error in test push notification:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
