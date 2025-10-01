import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    // This endpoint can be called to help debug auth issues
    return NextResponse.json({ 
      message: 'Session clear endpoint ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in clear-session endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
