import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    // Get all push tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('user_tokens')
      .select('expo_push_token, role, user_id')
      .not('expo_push_token', 'is', null);

    if (tokensError) {
      return NextResponse.json({ error: 'Failed to fetch tokens', details: tokensError }, { status: 500 });
    }

    // Test with a simple Expo API call
    const testToken = tokens?.[0]?.expo_push_token;
    if (!testToken) {
      return NextResponse.json({ 
        message: 'No valid push tokens found',
        tokens: tokens,
        tokenCount: tokens?.length || 0
      });
    }

    const testMessage = {
      to: testToken,
      title: 'Test Notification',
      body: 'This is a test notification',
      sound: 'default'
    };

    console.log('Testing with token:', testToken);
    console.log('Test message:', JSON.stringify(testMessage, null, 2));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    const result = await response.json();
    console.log('Expo API response:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      tokenCount: tokens?.length || 0,
      testToken: testToken,
      expoResponse: result,
      httpStatus: response.status,
      allTokens: tokens
    });

  } catch (error) {
    console.error('Error in debug push API:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

