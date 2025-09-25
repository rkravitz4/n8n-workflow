import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function getActualUserCount(): Promise<number> {
  try {
    // Use API route to get user count (server-side with admin client)
    const response = await fetch('/api/stats/users');
    
    if (!response.ok) {
      console.error('❌ Error fetching user count from API:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error getting user count:', error);
    return 0;
  }
}

export async function getActualNotificationCount(): Promise<number> {
  try {
    // Use API route to get notification count (server-side with admin client)
    const response = await fetch('/api/stats/notifications');
    
    if (!response.ok) {
      console.error('❌ Error fetching notification count from API:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error getting notification count:', error);
    return 0;
  }
}

export async function getActualEventCount(): Promise<number> {
  try {
    // Use API route to get event count (server-side with admin client)
    const response = await fetch('/api/stats/events');
    
    if (!response.ok) {
      console.error('❌ Error fetching event count from API:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error getting event count:', error);
    return 0;
  }
}

export async function getNewUsersThisMonth(): Promise<number> {
  try {
    // Use API route to get new users this month (server-side with admin client)
    const response = await fetch('/api/stats/new-users-this-month');
    
    if (!response.ok) {
      console.error('❌ Error fetching new users this month from API:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error getting new users this month:', error);
    return 0;
  }
}

export async function getNewUsersThisWeek(): Promise<number> {
  try {
    // Use API route to get new users this week (server-side with admin client)
    const response = await fetch('/api/stats/new-users-this-week');
    
    if (!response.ok) {
      console.error('❌ Error fetching new users this week from API:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error getting new users this week:', error);
    return 0;
  }
}

export async function getActiveUsersThisWeek(): Promise<number> {
  try {
    // Use API route to get active users this week (server-side with admin client)
    const response = await fetch('/api/stats/active-users-this-week');
    
    if (!response.ok) {
      console.error('❌ Error fetching active users this week from API:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error getting active users this week:', error);
    return 0;
  }
}

export async function getActiveUsersThisMonth(): Promise<number> {
  try {
    // Use API route to get active users this month (server-side with admin client)
    const response = await fetch('/api/stats/active-users-this-month');
    
    if (!response.ok) {
      console.error('❌ Error fetching active users this month from API:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error getting active users this month:', error);
    return 0;
  }
}

export async function getDeactivatedEvents(): Promise<number> {
  try {
    // Use API route to get deactivated events (server-side with admin client)
    const response = await fetch('/api/stats/deactivated-events');
    
    if (!response.ok) {
      console.error('❌ Error fetching deactivated events from API:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error getting deactivated events:', error);
    return 0;
  }
}

export async function getRecentActivity(): Promise<Array<{ activity: string; timestamp: string }>> {
  try {
    // Use API route to get recent activity (server-side with admin client)
    const response = await fetch('/api/stats/recent-activity');
    
    if (!response.ok) {
      console.error('❌ Error fetching recent activity from API:', response.statusText);
      return [];
    }

    const data = await response.json();
    // Convert complex activity objects to simple format expected by dashboard
    return (data.activities || []).map((activity: any) => ({
      activity: `${activity.title}: ${activity.description}`,
      timestamp: activity.timestamp
    }));
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}
