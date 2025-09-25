import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    // Calculate date one month ago
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoISO = monthAgo.toISOString();

    // Since last_sign_in_at doesn't exist in profiles table, 
    // we'll use updated_at as a proxy for user activity
    const { count, error } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('updated_at', 'is', null)
      .gte('updated_at', monthAgoISO);

    if (error) {
      console.error('Error fetching active users this month:', error);
      return NextResponse.json({ error: 'Failed to fetch active users this month' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in GET /api/stats/active-users-this-month:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
