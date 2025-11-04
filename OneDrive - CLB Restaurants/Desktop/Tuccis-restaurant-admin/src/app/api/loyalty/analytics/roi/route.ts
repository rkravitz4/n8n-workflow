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

    // 1. Total revenue from loyalty members ONLY (orders with has_loyalty_flag = true)
    const { data: loyaltyRevenue } = await supabase
      .from('check_storage')
      .select('amount_cents, subtotal_cents')
      .eq('has_loyalty_flag', true);

    const totalRevenue = loyaltyRevenue?.reduce((sum, check) => sum + (check.amount_cents || 0), 0) || 0;
    const totalNonAlcoholRevenue = loyaltyRevenue?.reduce((sum, check) => sum + (check.subtotal_cents || 0), 0) || 0;
    const totalAlcoholRevenue = totalRevenue - totalNonAlcoholRevenue;

    // 2. Total orders from loyalty members
    const totalOrders = loyaltyRevenue?.length || 0;

    // 3. Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 4. Total loyalty members
    const { count: totalMembers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('loyalty_code', 'is', null);

    // 5. Active members (ordered in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activeMembers } = await supabase
      .from('points_ledger')
      .select('user_id')
      .eq('reason', 'order_earn')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const uniqueActiveMembers = new Set(activeMembers?.map(m => m.user_id)).size;

    // 6. Repeat visit rate (customers with 2+ visits)
    const { data: userVisits } = await supabase
      .from('identity_links')
      .select('user_id');

    const visitCounts: { [key: string]: number } = {};
    userVisits?.forEach(visit => {
      visitCounts[visit.user_id] = (visitCounts[visit.user_id] || 0) + 1;
    });

    const repeatCustomers = Object.values(visitCounts).filter(count => count >= 2).length;
    const repeatRate = totalMembers ? (repeatCustomers / totalMembers!) * 100 : 0;

    // 7. Customer lifetime value
    const avgLifetimeValue = totalMembers ? totalRevenue / totalMembers! : 0;

    // 8. Revenue trend (last 7 days)
    const revenueTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const businessDate = parseInt(date.toISOString().split('T')[0].replace(/-/g, ''));
      
      const { data: dayRevenue } = await supabase
        .from('check_storage')
        .select('amount_cents')
        .eq('business_date', businessDate);
      
      const dayTotal = dayRevenue?.reduce((sum, check) => sum + (check.amount_cents || 0), 0) || 0;
      
      revenueTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayTotal / 100
      });
    }

    return NextResponse.json({
      totalRevenue: totalRevenue / 100,
      totalNonAlcoholRevenue: totalNonAlcoholRevenue / 100,
      totalAlcoholRevenue: totalAlcoholRevenue / 100,
      totalOrders,
      avgOrderValue: avgOrderValue / 100,
      totalMembers: totalMembers || 0,
      activeMembers: uniqueActiveMembers,
      repeatRate,
      avgLifetimeValue: avgLifetimeValue / 100,
      revenueTrend,
      // ROI Estimates
      estimatedNewRevenue: totalRevenue / 100, // Revenue from loyalty members
      estimatedRetentionValue: (repeatRate / 100) * (totalRevenue / 100), // Value from repeat visits
    });

  } catch (error) {
    console.error('Error in ROI analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


