import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Get all tokens
    const { data: tokens, error: fetchError } = await supabaseAdmin
      .from('user_tokens')
      .select('*');

    if (fetchError) {
      console.error('Error fetching tokens:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ 
        message: 'No tokens found to clean up',
        cleaned: 0
      });
    }

    let cleanedCount = 0;
    const invalidTokens = [];

    // Check each token for validity
    for (const token of tokens) {
      let isValid = true;

      // Check if user_id is valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token.user_id)) {
        isValid = false;
        console.log(`Invalid user_id format: ${token.user_id}`);
      }

      // Check if expo_push_token is valid format
      if (!token.expo_push_token || !token.expo_push_token.startsWith('ExponentPushToken[')) {
        isValid = false;
        console.log(`Invalid expo_push_token format: ${token.expo_push_token}`);
      }

      // Check if user exists in profiles
      if (isValid) {
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', token.user_id)
          .single();

        if (profileError || !profile) {
          isValid = false;
          console.log(`User not found in profiles: ${token.user_id}`);
        }
      }

      if (!isValid) {
        invalidTokens.push(token.id);
      }
    }

    // Delete invalid tokens
    if (invalidTokens.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('user_tokens')
        .delete()
        .in('id', invalidTokens);

      if (deleteError) {
        console.error('Error deleting invalid tokens:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      cleanedCount = invalidTokens.length;
    }

    return NextResponse.json({
      message: `Cleanup completed. Removed ${cleanedCount} invalid tokens.`,
      totalTokens: tokens.length,
      cleaned: cleanedCount,
      remaining: tokens.length - cleanedCount
    });

  } catch (error) {
    console.error('Error in cleanup invalid tokens API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

