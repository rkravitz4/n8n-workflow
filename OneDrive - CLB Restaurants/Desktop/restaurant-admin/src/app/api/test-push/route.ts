import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationService } from '@/lib/pushNotificationService';

export async function POST(request: NextRequest) {
  try {
    // Test the push notification service directly
    const result = await pushNotificationService.sendNotification({
      title: 'Test Push Notification',
      message: 'This is a test notification to debug the push service',
      targetAudience: 'all'
    });

    return NextResponse.json({
      success: true,
      result,
      expoAccessToken: pushNotificationService.getExpoAccessToken() ? 'Configured' : 'Not configured'
    });

  } catch (error) {
    console.error('Error in test push API:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      expoAccessToken: pushNotificationService.getExpoAccessToken() ? 'Configured' : 'Not configured'
    }, { status: 500 });
  }
}

