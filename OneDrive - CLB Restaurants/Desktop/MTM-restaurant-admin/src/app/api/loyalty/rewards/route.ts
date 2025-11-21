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
      .eq('brand', 'matts')
      .order('points_cost', { ascending: true });

    if (error) {
      console.error('Error fetching rewards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rewards', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[REWARDS API] Found ${data?.length || 0} rewards for brand 'matts'`);
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
    const { name, description, points_cost, value_cents, reward_type, active, brand, image_url, free_item_name } = body;

    if (!name || !description || !points_cost || !reward_type) {
      return NextResponse.json(
        { error: 'Name, description, points_cost, and reward_type are required' },
        { status: 400 }
      );
    }

    // Validate free_item_name for free_item rewards
    if (reward_type === 'free_item' && !free_item_name) {
      return NextResponse.json(
        { error: 'free_item_name is required for free_item rewards' },
        { status: 400 }
      );
    }

    // value_cents is optional for free_item rewards
    const finalValueCents = reward_type === 'free_item' ? 0 : (value_cents || 0);

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
        value_cents: finalValueCents,
        reward_type,
        active: active ?? true,
        brand: brand || 'matts',
        image_url: image_url || null,
        free_item_name: reward_type === 'free_item' ? free_item_name : null
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
