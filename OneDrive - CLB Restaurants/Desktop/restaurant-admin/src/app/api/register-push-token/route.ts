import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper functions to detect token type and device information
function detectTokenType(token: string): 'expo' | 'apns' | 'fcm' {
  if (token.startsWith('ExponentPushToken[')) {
    return 'expo';
  } else if (token.length === 64 && /^[a-fA-F0-9]+$/.test(token)) {
    return 'apns'; // APNs tokens are 64 hex characters
  } else if (token.length > 100 && (token.includes(':') || token.includes('-'))) {
    return 'fcm'; // FCM tokens are longer and contain colons or dashes
  }
  return 'expo'; // Default fallback for Expo tokens
}

function detectDeviceType(token: string, platform?: string): 'ios' | 'android' {
  // Use platform info from the app if available
  if (platform === 'ios' || platform === 'android') {
    return platform;
  }
  
  // Fallback to token-based detection
  if (token.startsWith('ExponentPushToken[')) {
    // Expo tokens can be from either iOS or Android
    return 'ios'; // Default to iOS for now
  } else if (token.length === 64 && /^[a-fA-F0-9]+$/.test(token)) {
    return 'ios'; // APNs tokens are iOS
  } else if (token.length > 100 && (token.includes(':') || token.includes('-'))) {
    return 'android'; // FCM tokens are typically Android
  }
  return 'ios'; // Default fallback
}

function detectBuildType(token: string, buildType?: string): 'development' | 'production' | 'testflight' {
  // Use build type from the app if available
  if (buildType && ['development', 'production', 'testflight'].includes(buildType)) {
    return buildType as 'development' | 'production' | 'testflight';
  }
  
  // Fallback to token-based detection
  if (token.startsWith('ExponentPushToken[')) {
    return 'production'; // Expo tokens are typically production builds
  } else if (token.length === 64 && /^[a-fA-F0-9]+$/.test(token)) {
    return 'production'; // APNs tokens are typically production
  } else if (token.length > 100 && (token.includes(':') || token.includes('-'))) {
    return 'production'; // FCM tokens are typically production
  }
  return 'production'; // Default to production
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const { userId, pushToken, platform, buildType } = await request.json();

    // Validate required fields
    if (!userId || !pushToken) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, pushToken' 
      }, { status: 400 });
    }

    // Validate userId is a valid UUID (not anonymous)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ 
        error: 'Invalid userId format. User must be authenticated.' 
      }, { status: 400 });
    }

    // Validate push token format (accept Expo Push Tokens for all platforms)
    const isValidToken = pushToken.startsWith('ExponentPushToken[');

    if (!isValidToken) {
      return NextResponse.json({ 
        error: 'Invalid push token format. Expected ExponentPushToken[...] format.' 
      }, { status: 400 });
    }

    // Verify user exists in profiles table and get their role
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ 
        error: 'User not found. User must be authenticated and have a profile.' 
      }, { status: 400 });
    }

    const userRole = userProfile.role || 'user';
    console.log(`Registering push token for authenticated user: ${userProfile.email} (${userId}) with role: ${userRole}`);

    // Check if token already exists for this user
    const { data: existingToken, error: checkError } = await supabaseAdmin
      .from('user_tokens')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing token:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingToken) {
      // Detect token type and device information
      const tokenType = detectTokenType(pushToken);
      const deviceType = detectDeviceType(pushToken, platform);
      const detectedBuildType = detectBuildType(pushToken, buildType);

      // Update existing token
      const { data, error } = await supabaseAdmin
        .from('user_tokens')
        .update({
          expo_push_token: pushToken,
          role: userRole,
          notification_enabled: true,
          token_type: tokenType,
          device_type: deviceType,
          app_build_type: detectedBuildType,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating push token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Push token updated successfully',
        token: data
      });
    } else {
      // Detect token type and device information
      const tokenType = detectTokenType(pushToken);
      const deviceType = detectDeviceType(pushToken, platform);
      const detectedBuildType = detectBuildType(pushToken, buildType);

      // Insert new token
      const { data, error } = await supabaseAdmin
        .from('user_tokens')
        .insert([{
          user_id: userId,
          expo_push_token: pushToken,
          role: userRole,
          notification_enabled: true,
          token_type: tokenType,
          device_type: deviceType,
          app_build_type: detectedBuildType
        }])
        .select()
        .single();

      if (error) {
        console.error('Error inserting push token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Push token registered successfully',
        token: data
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error in register push token API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ 
        error: 'Missing required field: userId' 
      }, { status: 400 });
    }

    // Delete push token for user
    const { error } = await supabaseAdmin
      .from('user_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting push token:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Push token unregistered successfully'
    });

  } catch (error) {
    console.error('Error in unregister push token API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
