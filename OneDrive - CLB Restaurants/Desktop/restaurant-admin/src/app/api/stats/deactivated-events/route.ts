import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { count, error } = await supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    if (error) {
      console.error('Error fetching deactivated events:', error);
      return NextResponse.json({ error: 'Failed to fetch deactivated events' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in GET /api/stats/deactivated-events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
