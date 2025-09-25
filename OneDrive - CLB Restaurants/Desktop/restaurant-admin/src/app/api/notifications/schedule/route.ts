import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { title, message, targetAudience, deep_link, sentBy, scheduledTime } = await request.json();

    if (!title || !message || !targetAudience || !sentBy || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
    }

    // Create scheduled notification record
    const { data, error } = await supabaseAdmin
      .from('scheduled_notifications')
      .insert({
        title,
        message,
        target_audience: targetAudience,
        deep_link: deep_link || null,
        sent_by: sentBy,
        scheduled_time: scheduledTime,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scheduled notification:', error);
      return NextResponse.json({ error: 'Failed to schedule notification' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Notification scheduled successfully',
      scheduledNotification: data 
    }, { status: 200 });

  } catch (error) {
    console.error('Error in schedule notification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

