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

    // Get loyalty statistics from Supabase
    const [
      { data: loyaltyBalances, error: loyaltyError },
      { data: rewards, error: rewardsError },
      { data: pendingTokens, error: tokensError },
      healthCheck
    ] = await Promise.all([
      // Get total users and points
      supabase
        .from('loyalty_balances')
        .select('user_id, current_points, loyalty_tier'),
      
      // Get active rewards count
      supabase
        .from('reward_catalog')
        .select('id')
        .eq('active', true)
        .eq('brand', 'tuccis'),
      
      // Get pending redemptions
      supabase
        .from('reward_tokens')
        .select('id')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString()),
      
      // Check system health (call our health endpoint)
      fetch('https://svvgjqmrpkrqhooowlqt.supabase.co/functions/v1/loyalty-health', {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      })
    ]);

    if (loyaltyError) {
      console.error('Error fetching loyalty balances:', loyaltyError);
    }

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
    }

    if (tokensError) {
      console.error('Error fetching reward tokens:', tokensError);
    }

    // Calculate tier breakdown
    const tierBreakdown = {
      regular: 0,
      blend: 0,
      barrel: 0,
      cellar: 0,
      vintage: 0
    };

    if (loyaltyBalances) {
      loyaltyBalances.forEach(balance => {
        const tier = balance.loyalty_tier || 'regular';
        if (tier in tierBreakdown) {
          tierBreakdown[tier as keyof typeof tierBreakdown]++;
        }
      });
    }

    // Calculate totals - only count loyalty members (exclude regular users)
    const totalUsers = tierBreakdown.blend + tierBreakdown.barrel + tierBreakdown.cellar + tierBreakdown.vintage;
    const totalPoints = loyaltyBalances?.reduce((sum, balance) => sum + (balance.current_points || 0), 0) || 0;
    const activeRewards = rewards?.length || 0;
    const pendingRedemptions = pendingTokens?.length || 0;

    // Determine system health
    let systemHealth: 'healthy' | 'degraded' | 'error' = 'healthy';
    try {
      if (healthCheck.ok) {
        const healthData = await healthCheck.json();
        systemHealth = healthData.status === 'healthy' ? 'healthy' : 
                      healthData.status === 'degraded' ? 'degraded' : 'error';
      } else {
        systemHealth = 'error';
      }
    } catch (error) {
      console.error('Error checking system health:', error);
      systemHealth = 'error';
    }

    return NextResponse.json({
      totalUsers,
      totalPoints,
      activeRewards,
      pendingRedemptions,
      systemHealth,
      tierBreakdown
    });

  } catch (error) {
    console.error('Error in loyalty stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty statistics' },
      { status: 500 }
    );
  }
}
