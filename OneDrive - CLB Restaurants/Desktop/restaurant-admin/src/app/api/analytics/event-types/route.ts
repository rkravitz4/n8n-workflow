import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { data: eventData, error } = await supabaseAdmin
      .from('events')
      .select('event_type, is_active')
      .order('event_type');

    if (error) {
      console.error('Error fetching event types data:', error);
      return NextResponse.json({ error: 'Failed to fetch event types data' }, { status: 500 });
    }

    // Count event types and their active status
    const eventTypeCounts: { [key: string]: { active: number, inactive: number } } = {};
    
    eventData?.forEach(event => {
      if (!eventTypeCounts[event.event_type]) {
        eventTypeCounts[event.event_type] = { active: 0, inactive: 0 };
      }
      if (event.is_active) {
        eventTypeCounts[event.event_type].active += 1;
      } else {
        eventTypeCounts[event.event_type].inactive += 1;
      }
    });

    // Convert to array with display names and colors
    const eventTypeChartData = Object.entries(eventTypeCounts).map(([type, counts]) => {
      let displayName = type;
      let color = '#810000';
      
      switch (type) {
        case 'brunch':
          displayName = 'Weekend Brunch';
          color = '#ab974f';
          break;
        case 'happy_hour':
          displayName = 'Happy Hour';
          color = '#810000';
          break;
        case 'music':
          displayName = 'Live Music';
          color = '#ab974f';
          break;
        case 'private_dining':
          displayName = 'Private Dining';
          color = '#810000';
          break;
        case 'special':
          displayName = 'Special Events';
          color = '#ab974f';
          break;
        case 'tasting':
          displayName = 'Wine/Bourbon Tasting';
          color = '#810000';
          break;
        case 'other':
          displayName = 'Other Events';
          color = '#ab974f';
          break;
        default:
          displayName = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
      }

      return {
        type: displayName,
        active: counts.active,
        inactive: counts.inactive,
        total: counts.active + counts.inactive,
        color: color
      };
    });

    // Sort by total count descending
    eventTypeChartData.sort((a, b) => b.total - a.total);

    return NextResponse.json({ eventTypeDistribution: eventTypeChartData });
  } catch (error) {
    console.error('Error in GET /api/analytics/event-types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
