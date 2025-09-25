'use client';

import Link from 'next/link';
import DashboardNavbar from '../../../components/DashboardNavbar';
import { AnalyticsIcon, EventsIcon, NotificationsIcon, UsersIcon, NewUsersIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getActualUserCount, getActualNotificationCount, getActualEventCount, getRecentActivity, getNewUsersThisMonth } from '@/utils/databaseHelper';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEvents: 0,
    notificationsSent: 0,
    newUsersThisMonth: 0
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'event' | 'notification' | 'user';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
  }>>([]);
  const [loading, setLoading] = useState(false); // Start with false to show UI immediately

  console.log('Dashboard render - loading:', loading);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 Fetching real statistics from database...');
        
        // Shorter timeout for better UX
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );
        
        // Get actual counts and recent activity from database
        const statsPromise = Promise.all([
          getActualUserCount(),
          getActualNotificationCount(),
          getActualEventCount(),
          getNewUsersThisMonth(),
          getRecentActivity()
        ]);

        const [userCount, notificationCount, eventCount, newUsersThisMonth, activity] = await Promise.race([
          statsPromise,
          timeoutPromise
        ]) as [number, number, number, number, Array<{ activity: string; timestamp: string }>];

        // Update stats with real data
        setStats({
          totalUsers: userCount,
          activeEvents: eventCount,
          notificationsSent: notificationCount,
          newUsersThisMonth: newUsersThisMonth
        });
        
        // Update recent activity
        setRecentActivity(activity.map((item, index) => ({
          id: `activity-${index}`,
          type: 'notification' as const,
          title: item.activity,
          description: '',
          timestamp: item.timestamp
        })));
        
        console.log('✅ Statistics updated:', { userCount, notificationCount, eventCount, newUsersThisMonth, activityCount: activity.length });
        
      } catch (error) {
        console.error('❌ Error fetching stats:', error);
        // Set default values on error to prevent infinite loading
        setStats({
          totalUsers: 0,
          activeEvents: 0,
          notificationsSent: 0,
          newUsersThisMonth: 0
        });
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <DashboardNavbar currentPage="dashboard" showUserInfo={true} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">Welcome to Tucci&apos;s Admin</h2>
            <p className="text-gray-600 text-lg">Manage your restaurant operations from this central dashboard.</p>
            <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="tucci-card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-full bg-[#810000]/10">
                    <UsersIcon size={24} className="text-[#810000]" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                      ) : (
                        stats.totalUsers.toLocaleString()
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="tucci-card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-full bg-[#ab974f]/10">
                    <EventsIcon size={24} className="text-[#ab974f]" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Events</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                      ) : (
                        stats.activeEvents
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="tucci-card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-full bg-[#810000]/10">
                    <NotificationsIcon size={24} className="text-[#810000]" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Notifications Sent</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                      ) : (
                        stats.notificationsSent
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="tucci-card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-full bg-[#ab974f]/10">
                    <NewUsersIcon size={24} className="text-[#ab974f]" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">New Users This Month</dt>
                    <dd className="text-2xl font-bold text-[#810000]">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                      ) : (
                        stats.newUsersThisMonth.toLocaleString()
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="tucci-card p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6 tucci-serif">Quick Actions</h3>
              <div className="space-y-4">
                <Link 
                  href="/events"
                  className="block w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#810000] hover:bg-[#810000]/5 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-[#ab974f]/10 group-hover:bg-[#ab974f]/20 transition-colors mr-4">
                      <EventsIcon size={20} className="text-[#ab974f]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-[#810000]">Manage Events</div>
                      <div className="text-sm text-gray-500">Create and edit restaurant events</div>
                    </div>
                  </div>
                </Link>
                
                <Link 
                  href="/notifications"
                  className="block w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#810000] hover:bg-[#810000]/5 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-[#810000]/10 group-hover:bg-[#810000]/20 transition-colors mr-4">
                      <NotificationsIcon size={20} className="text-[#810000]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-[#810000]">Send Notifications</div>
                      <div className="text-sm text-gray-500">Send push notifications to users</div>
                    </div>
                  </div>
                </Link>
                
                <Link 
                  href="/users"
                  className="block w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#810000] hover:bg-[#810000]/5 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-[#ab974f]/10 group-hover:bg-[#ab974f]/20 transition-colors mr-4">
                      <UsersIcon size={20} className="text-[#ab974f]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-[#810000]">User Management</div>
                      <div className="text-sm text-gray-500">Manage user accounts and roles</div>
                    </div>
                  </div>
                </Link>
                
                <Link 
                  href="/analytics"
                  className="block w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#810000] hover:bg-[#810000]/5 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-[#810000]/10 group-hover:bg-[#810000]/20 transition-colors mr-4">
                      <AnalyticsIcon size={20} className="text-[#810000]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-[#810000]">View Analytics</div>
                      <div className="text-sm text-gray-500">Check performance metrics</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="tucci-card p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6 tucci-serif">Recent Activity</h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-3 h-3 rounded-full mt-2 bg-gray-200 animate-pulse"></div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                          <div className="animate-pulse bg-gray-200 h-3 w-1/4 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          activity.type === 'event' ? 'bg-[#ab974f]' :
                          activity.type === 'notification' ? 'bg-[#810000]' :
                          'bg-blue-500'
                        }`}></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="font-medium text-gray-900">{activity.title}</div>
                        <div className="text-sm text-gray-600">{activity.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent activity to display</p>
                    <p className="text-sm text-gray-400 mt-2">Activity will appear here as you use the admin panel</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}


