import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const startedAt = new Date().toISOString();
  
  try {
    console.log('🔄 [MANUAL SYNC] Starting manual Toast order sync...');
    
    if (!supabaseAdmin) {
      console.error('❌ [MANUAL SYNC] Supabase admin client not available');
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    // Call the Supabase Edge Function that syncs Toast orders
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ [MANUAL SYNC] Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }
    
    const syncUrl = `${supabaseUrl}/functions/v1/loyalty-sync-orders`;
    
    console.log('🔄 [MANUAL SYNC] Calling Edge Function:', syncUrl);
    
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({})
    });
    
    console.log('📊 [MANUAL SYNC] Edge Function response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [MANUAL SYNC] Edge Function error:', errorText);
      return NextResponse.json(
        { 
          error: 'Sync failed',
          details: errorText,
          status: 'error',
          ordersProcessed: 0,
          pointsAwarded: 0
        },
        { status: 500 }
      );
    }
    
    const result = await response.json();
    console.log('✅ [MANUAL SYNC] Sync completed:', result);
    
    const completedAt = new Date().toISOString();
    
    // Save sync history to database
    const syncHistoryData = {
      sync_type: 'manual',
      status: result.skipped ? 'skipped' : 'success',
      total_orders: result.totalOrders || 0,
      orders_processed: result.processed || 0,
      points_awarded: result.pointsAwarded || 0,
      phone_verified: result.phoneVerified || 0,
      message: result.message || 'Sync completed',
      business_hours: result.businessHours,
      skipped: result.skipped || false,
      duration_ms: result.duration,
      correlation_id: result.correlationId,
      steps: result.steps || [],
      started_at: startedAt,
      completed_at: completedAt
    };
    
    const { error: historyError } = await supabaseAdmin
      .from('loyalty_sync_history')
      .insert(syncHistoryData);
    
    if (historyError) {
      console.error('⚠️ [MANUAL SYNC] Failed to save sync history:', historyError);
    }
    
    // Handle both success and skipped scenarios
    if (result.skipped) {
      return NextResponse.json({
        status: 'success',
        ordersProcessed: 0,
        pointsAwarded: 0,
        lastSync: completedAt,
        message: result.message || 'Sync skipped - outside business hours',
        skipped: true,
        businessHours: result.businessHours,
        currentTime: result.currentTime
      });
    }
    
    return NextResponse.json({
      status: 'success',
      ordersProcessed: result.processed || 0,
      pointsAwarded: result.pointsAwarded || 0,
      phoneVerified: result.phoneVerified || 0,
      totalOrders: result.totalOrders || 0,
      lastSync: completedAt,
      message: result.message || 'Sync completed successfully',
      duration: result.duration,
      steps: result.steps
    });
    
  } catch (error) {
    console.error('❌ [MANUAL SYNC] Error:', error);
    
    const completedAt = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Save error to sync history
    if (supabaseAdmin) {
      const { error: historyError } = await supabaseAdmin
        .from('loyalty_sync_history')
        .insert({
          sync_type: 'manual',
          status: 'error',
          total_orders: 0,
          orders_processed: 0,
          points_awarded: 0,
          phone_verified: 0,
          message: 'Sync failed',
          error_details: errorMessage,
          started_at: startedAt,
          completed_at: completedAt
        });
      
      if (historyError) {
        console.error('⚠️ [MANUAL SYNC] Failed to save error to history:', historyError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        status: 'error',
        ordersProcessed: 0,
        pointsAwarded: 0
      },
      { status: 500 }
    );
  }
}

