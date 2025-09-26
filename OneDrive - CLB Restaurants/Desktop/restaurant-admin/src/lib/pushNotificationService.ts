interface SendNotificationOptions {
  title: string;
  message: string;
  targetAudience: 'all' | 'admins' | 'users' | 'system_admin';
  deep_link?: string | null;
  data?: any;
}

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: any;
  sound?: 'default';
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
  expiration?: number;
  image?: string; // For rich notifications with images
}


export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoAccessToken: string;

  private constructor() {
    // Expo access token for push notifications
    this.expoAccessToken = process.env.EXPO_ACCESS_TOKEN || '';
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Send push notification to all subscribed users
   */
  public async sendNotification(options: SendNotificationOptions): Promise<{ success: boolean; message: string; tokensSent?: number; receipts?: any[] }> {
    try {
      // Import supabaseAdmin dynamically to avoid circular imports
      const { supabaseAdmin } = await import('@/lib/supabase');
      
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available');
      }

      // Get push tokens based on target audience with new token type information
      let query = supabaseAdmin
        .from('user_tokens')
        .select('expo_push_token, role, token_type, device_type, app_build_type')
        .eq('notification_enabled', true); // Only get users who have enabled notifications

      if (options.targetAudience === 'admins') {
        query = query.in('role', ['admin', 'system_admin']);
      } else if (options.targetAudience === 'users') {
        query = query.eq('role', 'user');
      } else if (options.targetAudience === 'system_admin') {
        query = query.eq('role', 'system_admin');
      }
      // For 'all', we don't filter by role

      const { data: tokens, error: tokensError } = await query;

      if (tokensError) {
        console.error('Error fetching push tokens:', tokensError);
        throw new Error('Failed to fetch push tokens');
      }

      console.log(`Found ${tokens?.length || 0} tokens for target audience: ${options.targetAudience}`);

      if (!tokens || tokens.length === 0) {
        return {
          success: false,
          message: 'No push tokens found for the target audience. Users need to install the mobile app, log in, and enable notifications to receive push notifications.'
        };
      }

      // Filter out invalid tokens and get valid Expo Push Tokens
      const validTokens = tokens
        .map(t => t.expo_push_token)
        .filter(token => token && token.startsWith('ExponentPushToken['));

      if (validTokens.length === 0) {
        console.log('No valid Expo Push Tokens found. Available tokens:', tokens);
        return {
          success: false,
          message: 'No valid push tokens found. Users need to install the mobile app, log in, and enable notifications to receive push notifications.'
        };
      }

      console.log(`Sending push notification to ${validTokens.length} devices via Expo Push API`);

      // Send to Expo Push API (handles all platforms automatically)
      const result = await this.sendToExpoPushAPI(validTokens, options);
      return result;

    } catch (error) {
      console.error('Error sending push notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send push notification'
      };
    }
  }

  /**
   * Send push notification via Expo Push API (handles all platforms)
   */
  private async sendToExpoPushAPI(tokens: string[], options: SendNotificationOptions): Promise<{ success: boolean; message: string; tokensSent?: number; receipts?: any[] }> {
    try {
      // Import the robust push service
      const { sendExpoPushWithLogging } = await import('@/lib/expoPush');

      const pushMessage = {
        to: tokens,
        title: options.title,
        body: options.message,
        sound: 'default' as const,
        priority: 'high' as const,
        data: {
          ...options.data,
          ...(options.deep_link && { deep_link: options.deep_link })
        }
      };

      console.log(`Sending to ${tokens.length} devices via robust Expo Push API`);

      const result = await sendExpoPushWithLogging(pushMessage);

      if (result.status !== 200) {
        console.error('Expo Push API error:', result.json);
        return {
          success: false,
          message: result.json.message || result.json.error || `Expo Push API error (${result.status})`
        };
      }

      const receipts = Array.isArray(result.json.data) ? result.json.data : [result.json.data];
      const successfulReceipts = receipts.filter((receipt: any) => receipt.status === 'ok');

      return {
        success: true,
        message: `Push notification sent to ${successfulReceipts.length} devices`,
        tokensSent: successfulReceipts.length,
        receipts
      };

    } catch (error) {
      console.error('Error sending via Expo Push API:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Push notification send failed'
      };
    }
  }


  /**
   * Get Expo access token (if configured)
   */
  public getExpoAccessToken(): string {
    return this.expoAccessToken;
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();


