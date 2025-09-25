type ExpoMessage = {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  ttl?: number;
  priority?: "default" | "high";
  channelId?: string;
  image?: string;
};

const PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendExpoPush(msg: ExpoMessage, attempt = 1): Promise<any> {
  const startTime = Date.now();
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  const bodySize = JSON.stringify(msg).length;
  const tokenCount = Array.isArray(msg.to) ? msg.to.length : 1;
  
  console.log(`Expo Push Attempt ${attempt}: ${tokenCount} tokens, ${bodySize} bytes`);

  try {
    const resp = await fetch(PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(msg),
      keepalive: true,
    });

    const duration = Date.now() - startTime;
    console.log(`Expo API Response: ${resp.status} in ${duration}ms`);

    // Retry on 429/5xx
    if (resp.status === 429 || resp.status >= 500) {
      if (attempt <= 4) {
        const backoff = Math.min(1000 * 2 ** (attempt - 1), 8000);
        console.log(`Retrying in ${backoff}ms due to status ${resp.status}`);
        await sleep(backoff);
        return sendExpoPush(msg, attempt + 1);
      }
    }

    const json = await resp.json().catch(async () => ({ 
      raw: await resp.text(),
      parseError: true 
    }));

    // Log key fields for debugging
    console.log(`Expo Response:`, {
      attempt,
      status: resp.status,
      duration: `${duration}ms`,
      bodySize,
      tokenCount,
      hasData: !!json.data,
      hasErrors: !!json.errors,
      dataLength: Array.isArray(json.data) ? json.data.length : 0,
    });

    // Expo may return status=ok with ticket errors per message — bubble up for logging
    return { 
      status: resp.status, 
      json,
      duration,
      attempt,
      bodySize,
      tokenCount
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`Expo Push Network Error (attempt ${attempt}):`, {
      error: error.message,
      duration: `${duration}ms`,
      bodySize,
      tokenCount,
    });

    // Network-level failure: retry with backoff
    if (attempt <= 4) {
      const backoff = Math.min(1000 * 2 ** (attempt - 1), 8000);
      console.log(`Retrying in ${backoff}ms due to network error`);
      await sleep(backoff);
      return sendExpoPush(msg, attempt + 1);
    }
    
    throw error;
  }
}

export async function sendExpoPushWithLogging(
  msg: ExpoMessage, 
  userId?: string,
  tokenType?: string,
  deviceType?: string,
  appBuildType?: string
): Promise<any> {
  console.log('Expo Push Request:', {
    userId,
    tokenType,
    deviceType,
    appBuildType,
    tokenCount: Array.isArray(msg.to) ? msg.to.length : 1,
    title: msg.title,
    expoAccessTokenConfigured: !!process.env.EXPO_ACCESS_TOKEN,
  });

  const result = await sendExpoPush(msg);
  
  console.log('Expo Push Result:', {
    userId,
    success: result.status === 200,
    status: result.status,
    duration: result.duration,
    attempt: result.attempt,
    tokenCount: result.tokenCount,
  });

  return result;
}
