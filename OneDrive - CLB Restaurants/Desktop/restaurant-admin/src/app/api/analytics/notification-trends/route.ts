import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { data: notificationData, error } = await supabaseAdmin
      .from('notifications')
      .select('sent_at, target_audience')
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('Error fetching notification trends data:', error);
      return NextResponse.json({ error: 'Failed to fetch notification trends data' }, { status: 500 });
    }

    // Process monthly notification data
    const monthlyNotifications: { [key: string]: { all: number, admins: number, users: number } } = {};
    
    notificationData?.forEach(notification => {
      const month = new Date(notification.sent_at).toISOString().substring(0, 7); // YYYY-MM format
      if (!monthlyNotifications[month]) {
        monthlyNotifications[month] = { all: 0, admins: 0, users: 0 };
      }
      monthlyNotifications[month][notification.target_audience as keyof typeof monthlyNotifications[string]] += 1;
    });

    // Convert to array for charts
    const monthlyChartData = Object.entries(monthlyNotifications).map(([month, counts]) => {
      const date = new Date(month + '-01');
      const formattedMonth = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        month: formattedMonth,
        all: counts.all,
        admins: counts.admins,
        users: counts.users,
        total: counts.all + counts.admins + counts.users
      };
    });

    // Process target audience distribution
    const audienceCounts: { [key: string]: number } = {};
    notificationData?.forEach(notification => {
      audienceCounts[notification.target_audience] = (audienceCounts[notification.target_audience] || 0) + 1;
    });

    const audienceChartData = Object.entries(audienceCounts).map(([audience, count]) => {
      let displayName = audience;
      let color = '#810000';
      
      switch (audience) {
        case 'all':
          displayName = 'All Users';
          color = '#ab974f';
          break;
        case 'admins':
          displayName = 'Admins Only';
          color = '#810000';
          break;
        case 'users':
          displayName = 'Regular Users';
          color = '#000000';
          break;
      }

      return {
        audience: displayName,
        count: count,
        color: color
      };
    });

    return NextResponse.json({ 
      monthlyTrends: monthlyChartData,
      audienceDistribution: audienceChartData,
      totalNotifications: notificationData?.length || 0
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/notification-trends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
