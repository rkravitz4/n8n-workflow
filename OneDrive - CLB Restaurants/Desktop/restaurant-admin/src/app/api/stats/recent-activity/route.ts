import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const activities: Array<{
      id: string;
      type: 'event' | 'notification' | 'user';
      title: string;
      description: string;
      timestamp: string;
      user?: string;
    }> = [];

    // Get recent events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!eventsError && events) {
      for (const event of events) {
        activities.push({
          id: event.id,
          type: 'event',
          title: 'New Event Created',
          description: event.title,
          timestamp: event.created_at,
        });
      }
    }

    // Get recent notifications
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('id, title, sent_at, sent_by')
      .order('sent_at', { ascending: false })
      .limit(3);

    if (!notificationsError && notifications) {
      for (const notification of notifications) {
        activities.push({
          id: notification.id,
          type: 'notification',
          title: 'Notification Sent',
          description: notification.title,
          timestamp: notification.sent_at,
        });
      }
    }

    // Get recent user registrations
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, created_at, role')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!usersError && users) {
      for (const user of users) {
        activities.push({
          id: user.id,
          type: 'user',
          title: 'New User Registered',
          description: `${user.email} (${user.role})`,
          timestamp: user.created_at,
        });
      }
    }

    // Sort all activities by timestamp and return the most recent 5
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return NextResponse.json({ activities: sortedActivities });
  } catch (error) {
    console.error('Error in GET /api/stats/recent-activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
