import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const supabase = supabaseAdmin;

    // Get all checks with loyalty flags
    const { data: loyaltyChecks } = await supabase
      .from('check_storage')
      .select('closed_at, total_cents, order_guid')
      .eq('has_loyalty_flag', true)
      .not('closed_at', 'is', null);

    if (!loyaltyChecks || loyaltyChecks.length === 0) {
      // Return empty/default values if no data
      return NextResponse.json({
        peakHours: [],
        averageCheckSize: 0,
        visitFrequency: 0,
        preferredDays: []
      });
    }

    // 1. Calculate Peak Dining Hours
    const hourCounts: { [hour: string]: number } = {};
    loyaltyChecks.forEach(check => {
      const hour = new Date(check.closed_at).getHours();
      const hourLabel = hour === 12 ? '12 PM' : hour === 0 ? '12 AM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
      hourCounts[hourLabel] = (hourCounts[hourLabel] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);

    // 2. Calculate Average Check Size
    const totalRevenue = loyaltyChecks.reduce((sum, check) => sum + (check.total_cents || 0), 0);
    const averageCheckSize = loyaltyChecks.length > 0 ? totalRevenue / loyaltyChecks.length / 100 : 0;

    // 3. Calculate Visit Frequency (visits per member per month)
    const { data: loyaltyMembers } = await supabase
      .from('profiles')
      .select('id')
      .not('loyalty_code', 'is', null);

    const totalMembers = loyaltyMembers?.length || 1;
    
    // Get date range of loyalty data
    const oldestCheck = new Date(Math.min(...loyaltyChecks.map(c => new Date(c.closed_at).getTime())));
    const newestCheck = new Date(Math.max(...loyaltyChecks.map(c => new Date(c.closed_at).getTime())));
    const monthsSpan = Math.max(1, (newestCheck.getTime() - oldestCheck.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    const visitFrequency = loyaltyChecks.length / totalMembers / monthsSpan;

    // 4. Calculate Preferred Days
    const dayCounts: { [day: string]: number } = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    loyaltyChecks.forEach(check => {
      const dayIndex = new Date(check.closed_at).getDay();
      const dayName = dayNames[dayIndex];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    const preferredDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);

    return NextResponse.json({
      peakHours,
      averageCheckSize: Math.round(averageCheckSize * 100) / 100,
      visitFrequency: Math.round(visitFrequency * 10) / 10,
      preferredDays
    });

  } catch (error) {
    console.error('Error in dining trends API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

