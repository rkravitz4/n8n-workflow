import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Get the start of this month (September 1, 2025)
    const startOfMonth = '2025-09-01T00:00:00.000Z';

    const { count, error } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    if (error) {
      console.error('Error fetching new users this month:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in new users this month API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
