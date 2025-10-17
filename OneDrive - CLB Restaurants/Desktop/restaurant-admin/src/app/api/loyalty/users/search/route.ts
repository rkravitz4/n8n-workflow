import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const term = searchParams.get('term');

    if (!type || !term) {
      return NextResponse.json(
        { error: 'Type and term parameters are required' },
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
    let query = supabase.from('loyalty_balances').select('*');

    switch (type) {
      case 'email':
        query = query.ilike('email', `%${term}%`);
        break;
      case 'phone':
        query = query.ilike('phone_e164', `%${term}%`);
        break;
      case 'name':
        // For name search, we'll search in email since we don't have separate name field
        query = query.ilike('email', `%${term}%`);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid search type' },
          { status: 400 }
        );
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Error in user search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
