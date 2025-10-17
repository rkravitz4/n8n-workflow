import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { delta_points, note, admin_user } = await request.json();

    if (!userId || delta_points === undefined || !note || !admin_user) {
      return NextResponse.json(
        { error: 'User ID, delta_points, note, and admin_user are required' },
        { status: 400 }
      );
    }

    if (delta_points === 0) {
      return NextResponse.json(
        { error: 'Delta points cannot be zero' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const supabase = supabaseAdmin;

    // Add manual adjustment to points ledger
    const { error: ledgerError } = await supabase
      .from('points_ledger')
      .insert({
        user_id: userId,
        delta_points: delta_points,
        reason: 'manual_adjustment',
        note: `${note} (Admin: ${admin_user})`,
        created_at: new Date().toISOString()
      });

    if (ledgerError) {
      console.error('Error adding points adjustment:', ledgerError);
      return NextResponse.json(
        { error: 'Failed to process points adjustment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Points adjustment successful'
    });

  } catch (error) {
    console.error('Error in points adjustment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
