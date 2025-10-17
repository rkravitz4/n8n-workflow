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

    const { data, error } = await supabase
      .from('reward_catalog')
      .select('*')
      .eq('brand', 'tuccis')
      .order('points_cost', { ascending: true });

    if (error) {
      console.error('Error fetching rewards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Error in rewards API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, points_cost, value_cents, reward_type, active, brand, image_url } = body;

    if (!name || !description || !points_cost || !value_cents || !reward_type) {
      return NextResponse.json(
        { error: 'Name, description, points_cost, value_cents, and reward_type are required' },
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

    const { data, error } = await supabase
      .from('reward_catalog')
      .insert({
        name,
        description,
        points_cost,
        value_cents,
        reward_type,
        active: active ?? true,
        brand: brand || 'tuccis',
        image_url: image_url || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return NextResponse.json(
        { error: 'Failed to create reward' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in create reward API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
