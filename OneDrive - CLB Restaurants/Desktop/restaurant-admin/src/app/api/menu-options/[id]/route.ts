import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { id } = await params;

    const { data: menuOption, error } = await supabaseAdmin
      .from('menu_options')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching menu option:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ menuOption });
  } catch (error) {
    console.error('Error in GET /api/menu-options/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { id } = await params;
    const updateData = await request.json();

    const { data, error } = await supabaseAdmin
      .from('menu_options')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu option:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ menuOption: data });
  } catch (error) {
    console.error('Error in PUT /api/menu-options/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('menu_options')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting menu option:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/menu-options/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

