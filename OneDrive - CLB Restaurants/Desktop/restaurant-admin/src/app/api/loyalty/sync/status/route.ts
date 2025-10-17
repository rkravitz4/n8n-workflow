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
    
    // Get the most recent sync record
    const { data: lastSync, error } = await supabaseAdmin
      .from('loyalty_sync_history')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching sync status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sync status' },
        { status: 500 }
      );
    }
    
    // If no sync history exists, return default values
    if (!lastSync) {
      return NextResponse.json({
        lastSync: null,
        status: 'idle',
        ordersProcessed: 0,
        pointsAwarded: 0,
        phoneVerified: 0,
        totalOrders: 0,
        message: '',
        skipped: false
      });
    }
    
    // Return the last sync status
    return NextResponse.json({
      lastSync: lastSync.completed_at || lastSync.started_at,
      status: lastSync.status === 'error' ? 'error' : 
              lastSync.status === 'skipped' ? 'success' : 
              'success',
      ordersProcessed: lastSync.orders_processed || 0,
      pointsAwarded: lastSync.points_awarded || 0,
      phoneVerified: lastSync.phone_verified || 0,
      totalOrders: lastSync.total_orders || 0,
      message: lastSync.message || '',
      skipped: lastSync.skipped || false,
      syncType: lastSync.sync_type,
      duration: lastSync.duration_ms
    });
    
  } catch (error) {
    console.error('Error in sync status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

