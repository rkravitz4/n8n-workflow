import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    // Get monthly user growth data
    const { data: monthlyData, error: monthlyError } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (monthlyError) {
      console.error('Error fetching user growth data:', monthlyError);
      return NextResponse.json({ error: 'Failed to fetch user growth data' }, { status: 500 });
    }

    // Process data into monthly chunks
    const monthlyGrowth: { [key: string]: number } = {};
    const cumulativeGrowth: { [key: string]: number } = {};
    let cumulative = 0;

    monthlyData?.forEach(user => {
      const month = new Date(user.created_at).toISOString().substring(0, 7); // YYYY-MM format
      monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
      cumulative += 1;
      cumulativeGrowth[month] = cumulative;
    });

    // Convert to arrays for charts
    const monthlyChartData = Object.entries(monthlyGrowth).map(([month, count]) => {
      const date = new Date(month + '-01');
      const formattedMonth = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        month: formattedMonth,
        newUsers: count,
        cumulative: cumulativeGrowth[month]
      };
    });

    // Get weekly data for the last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks

    const weeklyGrowth: { [key: string]: number } = {};
    const weeklyCumulative = 0;

    monthlyData?.forEach(user => {
      const userDate = new Date(user.created_at);
      if (userDate >= twelveWeeksAgo) {
        const weekStart = new Date(userDate);
        weekStart.setDate(userDate.getDate() - userDate.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().substring(0, 10); // YYYY-MM-DD format
        
        weeklyGrowth[weekKey] = (weeklyGrowth[weekKey] || 0) + 1;
      }
    });

    const weeklyChartData = Object.entries(weeklyGrowth).map(([week, count]) => {
      const date = new Date(week);
      const formattedWeek = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        week: formattedWeek,
        newUsers: count
      };
    }).sort((a, b) => new Date(Object.keys(weeklyGrowth).find(k => {
      const date = new Date(k);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === a.week;
    }) || '').getTime() - new Date(Object.keys(weeklyGrowth).find(k => {
      const date = new Date(k);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === b.week;
    }) || '').getTime());

    return NextResponse.json({ 
      monthly: monthlyChartData,
      weekly: weeklyChartData,
      totalUsers: monthlyData?.length || 0
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/user-growth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
