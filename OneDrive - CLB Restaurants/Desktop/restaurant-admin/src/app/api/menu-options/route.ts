import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { data: menuOptions, error } = await supabaseAdmin
      .from('menu_options')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching menu options:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group options by category
    const groupedOptions = menuOptions.reduce((acc, option) => {
      if (!acc[option.category]) {
        acc[option.category] = [];
      }
      acc[option.category].push(option);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({ menuOptions: groupedOptions });
  } catch (error) {
    console.error('Error in GET /api/menu-options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const menuOptionData = await request.json();
    
    // Validate required fields
    if (!menuOptionData.value || !menuOptionData.label || !menuOptionData.category) {
      return NextResponse.json({ 
        error: 'Missing required fields: value, label, and category are required' 
      }, { status: 400 });
    }

    // Get the next display order for the category
    const { data: lastOption } = await supabaseAdmin
      .from('menu_options')
      .select('display_order')
      .eq('category', menuOptionData.category)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextDisplayOrder = (lastOption?.display_order || 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('menu_options')
      .insert([{
        ...menuOptionData,
        display_order: nextDisplayOrder
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating menu option:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ menuOption: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/menu-options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

