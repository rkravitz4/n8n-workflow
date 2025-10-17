import { NextRequest, NextResponse } from 'next/server';

export const config = { runtime: "nodejs" };

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('Testing Expo API connectivity from Vercel...');
    
    const headers: Record<string, string> = {
      "accept": "application/json",
      "content-type": "application/json",
    };
    
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers["authorization"] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
      console.log('Using Expo access token for authentication');
    } else {
      console.log('No Expo access token configured - testing without auth');
    }

    const testPayload = {
      to: "ExponentPushToken[FAKE_FOR_TEST]",
      title: "Server Ping",
      body: "Testing outbound connectivity from Vercel",
    };

    console.log('Sending test request to Expo API...');
    
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
      keepalive: true,
    });

    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    console.log(`Expo API response: ${response.status} - ${responseText.substring(0, 200)}...`);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return NextResponse.json({
      success: true,
      test: "Expo API connectivity from Vercel",
      duration: `${duration}ms`,
      status: response.status,
      statusText: response.statusText,
      expoAccessTokenConfigured: !!process.env.EXPO_ACCESS_TOKEN,
      response: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('Expo API connectivity test failed:', error);
    
    return NextResponse.json({
      success: false,
      test: "Expo API connectivity from Vercel",
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack,
      expoAccessTokenConfigured: !!process.env.EXPO_ACCESS_TOKEN,
    }, { status: 500 });
  }
}




