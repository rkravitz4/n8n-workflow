'use client';

import { useEffect, useState } from 'react';
import DashboardNavbar from '@/components/DashboardNavbar';
import { UsersIcon, EventsIcon, NotificationsIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getActualUserCount, getActualEventCount, getActualNotificationCount, getNewUsersThisWeek, getActiveUsersThisWeek, getNewUsersThisMonth, getActiveUsersThisMonth, getDeactivatedEvents } from '@/utils/databaseHelper';

// All data will be fetched from the database - no mock data

// Notification stats will be fetched from the database

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEvents: 0,
    notificationsSent: 0,
    newUsersThisMonth: 0,
    newUsersThisWeek: 0,
    activeUsersThisWeek: 0,
    activeUsersThisMonth: 0,
    deactivatedEvents: 0
  });

  const [chartData, setChartData] = useState({
    userGrowth: { monthly: [], weekly: [], totalUsers: 0 },
    userRoles: { roleDistribution: [] },
    eventTypes: { eventTypeDistribution: [] },
    notificationTrends: { monthlyTrends: [], audienceDistribution: [], totalNotifications: 0 }
  });

  const [modalChart, setModalChart] = useState<{
    type: 'userRoles' | 'userGrowth' | 'weeklyGrowth' | 'notifications' | null;
    title: string;
    data: any;
  }>({ type: null, title: '', data: null });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch real statistics using database helper functions
        const [totalUsers, activeEvents, notificationsSent, newUsersThisMonth, newUsersThisWeek, activeUsersThisWeek, activeUsersThisMonth, deactivatedEvents] = await Promise.all([
          getActualUserCount(),
          getActualEventCount(),
          getActualNotificationCount(),
          getNewUsersThisMonth(),
          getNewUsersThisWeek(),
          getActiveUsersThisWeek(),
          getActiveUsersThisMonth(),
          getDeactivatedEvents()
        ]);

        setStats({
          totalUsers,
          activeEvents,
          notificationsSent,
          newUsersThisMonth,
          newUsersThisWeek,
          activeUsersThisWeek,
          activeUsersThisMonth,
          deactivatedEvents
        });

        // Fetch chart data
        const [userGrowthResponse, userRolesResponse, notificationTrendsResponse] = await Promise.all([
          fetch('/api/analytics/user-growth'),
          fetch('/api/analytics/user-roles'),
          fetch('/api/analytics/notification-trends')
        ]);

        const [userGrowthData, userRolesData, notificationTrendsData] = await Promise.all([
          userGrowthResponse.json(),
          userRolesResponse.json(),
          notificationTrendsResponse.json()
        ]);

        setChartData({
          userGrowth: userGrowthData,
          userRoles: userRolesData,
          eventTypes: { eventTypeDistribution: [] },
          notificationTrends: notificationTrendsData
        });
        
      } catch (error) {
        console.error('Error fetching analytics stats:', error);
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
        <DashboardNavbar currentPage="analytics" showUserInfo={true} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">Analytics Overview</h2>
              <p className="text-gray-600 text-lg">Comprehensive insights into your restaurant&apos;s performance and user engagement.</p>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="tucci-card p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Statistics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Total Users */}
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
                          <dd className="text-2xl font-bold text-[#810000]">
                            {stats.totalUsers.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Breakdown */}
                  <div className="tucci-card p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-full bg-[#ab974f]/10">
                          <UsersIcon size={24} className="text-[#ab974f]" />
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">New Users This Month</dt>
                          <dd className="text-2xl font-bold text-[#810000]">
                            {stats.newUsersThisMonth.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>

                  <div className="tucci-card p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-full bg-[#810000]/10">
                          <UsersIcon size={24} className="text-[#810000]" />
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Active Users This Month</dt>
                          <dd className="text-2xl font-bold text-[#810000]">
                            {stats.activeUsersThisMonth.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Breakdown */}
                  <div className="tucci-card p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-full bg-[#ab974f]/10">
                          <UsersIcon size={24} className="text-[#ab974f]" />
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">New Users This Week</dt>
                          <dd className="text-2xl font-bold text-[#810000]">
                            {stats.newUsersThisWeek.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>

                  <div className="tucci-card p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-full bg-[#810000]/10">
                          <UsersIcon size={24} className="text-[#810000]" />
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Active Users This Week</dt>
                          <dd className="text-2xl font-bold text-[#810000]">
                            {stats.activeUsersThisWeek.toLocaleString()}
                          </dd>
                        </dl>
                    </div>
                  </div>
                </div>

                  {/* Events */}
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
                          <dd className="text-2xl font-bold text-[#810000]">
                            {stats.activeEvents.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>

                  <div className="tucci-card p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-full bg-[#810000]/10">
                          <EventsIcon size={24} className="text-[#810000]" />
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Deactivated Events</dt>
                          <dd className="text-2xl font-bold text-[#810000]">
                            {stats.deactivatedEvents.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                  </div>
                </div>

                  {/* Notifications */}
                <div className="tucci-card p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-full bg-[#ab974f]/10">
                          <NotificationsIcon size={24} className="text-[#ab974f]" />
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Notifications Sent</dt>
                          <dd className="text-2xl font-bold text-[#810000]">
                            {stats.notificationsSent.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div 
                    className="tucci-card p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setModalChart({
                      type: 'userRoles',
                      title: 'User Role Distribution',
                      data: chartData.userRoles.roleDistribution
                    })}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 tucci-serif">User Role Distribution</h3>
                    {chartData.userRoles.roleDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={chartData.userRoles.roleDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => `${entry.role}: ${entry.count} (${(entry.percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                            animationDuration={1000}
                            animationEasing="ease-out"
                          >
                            {chartData.userRoles.roleDistribution.map((entry: { color: string }, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color}
                                stroke="#ffffff"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${value} users`, 'Count']}
                            contentStyle={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              backgroundColor: '#ffffff',
                              border: '1px solid #d1d5db',
                              borderRadius: '12px',
                              padding: '12px',
                              color: '#111827',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            }}
                            animationDuration={200}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No user data available</p>
                      </div>
                    )}
                    <div className="mt-2 text-center text-xs text-gray-600">
                      <p>Click to enlarge</p>
                    </div>
                  </div>

                  <div 
                    className="tucci-card p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setModalChart({
                      type: 'userGrowth',
                      title: 'Monthly User Growth',
                      data: chartData.userGrowth.monthly
                    })}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 tucci-serif">Monthly User Growth</h3>
                    {chartData.userGrowth.monthly.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData.userGrowth.monthly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value} users`, 'New Users']}
                            contentStyle={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              backgroundColor: '#f8f9fa',
                              border: '1px solid #dee2e6',
                              borderRadius: '8px',
                              padding: '12px',
                              color: '#000000'
                            }}
                          />
                          <Bar dataKey="newUsers" fill="#810000" name="New Users This Month" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No growth data available</p>
                      </div>
                    )}
                    <div className="mt-2 text-center text-xs text-gray-600">
                      <p>Click to enlarge</p>
                    </div>
                  </div>
                </div>

                {/* Weekly User Growth */}
                <div 
                  className="tucci-card p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setModalChart({
                    type: 'weeklyGrowth',
                    title: 'Recent User Activity',
                    data: chartData.userGrowth.weekly
                  })}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 tucci-serif">Recent User Activity</h3>
                  {chartData.userGrowth.weekly.length > 0 ? (
                    <div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData.userGrowth.weekly}>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="#e5e7eb" 
                            strokeOpacity={0.3}
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="week" 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={{ stroke: '#e5e7eb' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={{ stroke: '#e5e7eb' }}
                          />
                          <Tooltip 
                            labelFormatter={(label) => `${label}`}
                            formatter={(value: number) => [`${value} users`, 'New Users']}
                            contentStyle={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              backgroundColor: '#ffffff',
                              border: '1px solid #d1d5db',
                              borderRadius: '12px',
                              padding: '12px',
                              color: '#111827',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            }}
                            animationDuration={200}
                          />
                          <Bar 
                            dataKey="newUsers" 
                            fill="#ab974f" 
                            name="New Users"
                            radius={[4, 4, 0, 0]}
                            animationDuration={800}
                            animationEasing="ease-out"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-3 text-center text-xs text-gray-600">
                        <p>Shows new user registrations by week • Click to enlarge</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No recent activity data available</p>
                    </div>
                  )}
                </div>

                {/* Notification Analytics */}
                <div 
                  className="tucci-card p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setModalChart({
                    type: 'notifications',
                    title: 'Notification Activity',
                    data: chartData.notificationTrends.monthlyTrends
                  })}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 tucci-serif">Notification Activity</h3>
                  {chartData.notificationTrends.monthlyTrends.length > 0 ? (
                    <div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData.notificationTrends.monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value} notifications`, 'Sent']}
                            contentStyle={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              backgroundColor: '#f8f9fa',
                              border: '1px solid #dee2e6',
                              borderRadius: '8px',
                              padding: '12px',
                              color: '#000000'
                            }}
                          />
                          <Bar dataKey="total" fill="#810000" name="Notifications Sent" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-3 text-center text-xs text-gray-600">
                        <p>Shows how many notifications were sent each month • Click to enlarge</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No notification data available</p>
                  </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Modal for Enlarged Charts */}
        {modalChart.type && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900 tucci-serif">{modalChart.title}</h2>
                <button
                  onClick={() => setModalChart({ type: null, title: '', data: null })}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <div className="h-96">
                  {modalChart.type === 'userRoles' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={modalChart.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => `${entry.role}: ${entry.count} (${(entry.percent * 100).toFixed(0)}%)`}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="count"
                          animationDuration={1200}
                          animationEasing="ease-out"
                        >
                          {modalChart.data.map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value} users`, 'Count']}
                          contentStyle={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: '12px',
                            padding: '16px',
                            color: '#111827',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                          }}
                          animationDuration={200}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {modalChart.type === 'userGrowth' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modalChart.data}>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#e5e7eb" 
                          strokeOpacity={0.3}
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 14, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 14, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value} users`, 'New Users']}
                          contentStyle={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: '12px',
                            padding: '16px',
                            color: '#111827',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                          }}
                          animationDuration={200}
                        />
                        <Bar 
                          dataKey="newUsers" 
                          fill="#810000" 
                          name="New Users This Month"
                          radius={[6, 6, 0, 0]}
                          animationDuration={1000}
                          animationEasing="ease-out"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {modalChart.type === 'weeklyGrowth' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modalChart.data}>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#e5e7eb" 
                          strokeOpacity={0.3}
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="week" 
                          tick={{ fontSize: 14, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 14, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip 
                          labelFormatter={(label) => `${label}`}
                          formatter={(value: number) => [`${value} users`, 'New Users']}
                          contentStyle={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: '12px',
                            padding: '16px',
                            color: '#111827',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                          }}
                          animationDuration={200}
                        />
                        <Bar 
                          dataKey="newUsers" 
                          fill="#ab974f" 
                          name="New Users"
                          radius={[6, 6, 0, 0]}
                          animationDuration={1000}
                          animationEasing="ease-out"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {modalChart.type === 'notifications' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modalChart.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`${value} notifications`, 'Sent']}
                          contentStyle={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            padding: '16px',
                            color: '#000000'
                          }}
                        />
                        <Bar dataKey="total" fill="#810000" name="Notifications Sent" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
