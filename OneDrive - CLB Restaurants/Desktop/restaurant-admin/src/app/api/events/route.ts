import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('order_priority', { ascending: true, nullsFirst: false })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in GET /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const eventData = await request.json();
    
    // Get the next display order
    const { data: lastEvent } = await supabaseAdmin
      .from('events')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextDisplayOrder = (lastEvent?.display_order || 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert([{
        ...eventData,
        display_order: nextDisplayOrder
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
