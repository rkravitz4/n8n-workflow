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
    
    // Get the last 20 sync records
    const { data: history, error } = await supabaseAdmin
      .from('loyalty_sync_history')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching sync history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sync history' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(history || []);
    
  } catch (error) {
    console.error('Error in sync history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

