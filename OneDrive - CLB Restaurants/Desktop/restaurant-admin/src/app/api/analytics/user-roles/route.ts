import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not available' }, { status: 500 });
    }

    const { data: roleData, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .order('role');

    if (error) {
      console.error('Error fetching user roles data:', error);
      return NextResponse.json({ error: 'Failed to fetch user roles data' }, { status: 500 });
    }

    // Count roles
    const roleCounts: { [key: string]: number } = {};
    roleData?.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });

    // Convert to array with display names and colors
    const roleChartData = Object.entries(roleCounts).map(([role, count]) => {
      let displayName = role;
      let color = '#810000';
      
      switch (role) {
        case 'user':
          displayName = 'Regular Users';
          color = '#16a34a'; // green-600 (matches bg-green-100 text-green-800)
          break;
        case 'admin':
          displayName = 'Admins';
          color = '#dc2626'; // red-600 (matches bg-red-100 text-red-800)
          break;
        case 'system_admin':
          displayName = 'System Admins';
          color = '#9333ea'; // purple-600 (matches bg-purple-100 text-purple-800)
          break;
        default:
          displayName = role.charAt(0).toUpperCase() + role.slice(1);
      }

      return {
        role: displayName,
        count: count,
        color: color,
        originalRole: role
      };
    });

    return NextResponse.json({ roleDistribution: roleChartData });
  } catch (error) {
    console.error('Error in GET /api/analytics/user-roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
