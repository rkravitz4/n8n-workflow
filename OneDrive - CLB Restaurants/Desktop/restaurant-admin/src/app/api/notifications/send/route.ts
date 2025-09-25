import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationService } from '@/lib/pushNotificationService';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const { title, message, targetAudience, deep_link, sentBy } = await request.json();

    // Validate required fields
    if (!title || !message || !targetAudience) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, message, targetAudience' 
      }, { status: 400 });
    }

    // Save notification to database
    const { data: notification, error: dbError } = await supabaseAdmin
      .from('notifications')
      .insert([{
        title,
        message,
        target_audience: targetAudience,
        deep_link: deep_link || null,
        sent_by: sentBy
      }])
      .select(`
        id,
        title,
        message,
        target_audience,
        sent_at,
        sent_by,
        tokens_sent,
        expo_response,
        deep_link
      `)
      .single();

    if (dbError) {
      console.error('Error saving notification to database:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Send push notification
    const pushResult = await pushNotificationService.sendNotification({
      title,
      message,
      targetAudience,
      deep_link,
      data: {
        notificationId: notification.id,
        timestamp: new Date().toISOString()
      }
    });

    // Update notification with tokens sent count
    const tokensSent = pushResult.tokensSent || 0;
    const { error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({ 
        tokens_sent: tokensSent,
        expo_response: pushResult
      })
      .eq('id', notification.id);

    if (updateError) {
      console.error('Error updating notification with push result:', updateError);
    }

    if (!pushResult.success) {
      console.warn('Push notification failed:', pushResult.message);
      // Return success status but with warning - notification was saved but push failed
      return NextResponse.json({ 
        success: true,
        warning: 'Notification saved but push delivery failed',
        message: pushResult.message,
        notification: { ...notification, tokens_sent: tokensSent },
        pushResult
      }, { status: 200 });
    }

    return NextResponse.json({ 
      notification: { ...notification, tokens_sent: tokensSent },
      pushResult
    }, { status: 201 });

  } catch (error) {
    console.error('Error in send notification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


