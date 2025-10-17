import { NextRequest, NextResponse } from 'next/server';
import { sendExpoPushWithLogging } from '@/lib/expoPush';

export async function POST(request: NextRequest) {
  try {
    const { token, title, message } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    console.log('Testing push token:', token);

    const result = await sendExpoPushWithLogging({
      to: token,
      title: title || 'Test Notification',
      body: message || 'This is a test push notification from the webapp',
      sound: 'default',
      priority: 'high',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Push test completed',
      result: result
    });

  } catch (error: any) {
    console.error('Error testing push token:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to test push token' 
    }, { status: 500 });
  }
}




