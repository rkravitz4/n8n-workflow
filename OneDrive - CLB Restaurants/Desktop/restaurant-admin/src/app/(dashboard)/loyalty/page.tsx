'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardNavbar from '../../../components/DashboardNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Icons
const UserIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const GiftIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const CheckCircleIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SettingsIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SyncIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

interface LoyaltyStats {
  totalUsers: number;
  totalPoints: number;
  activeRewards: number;
  pendingRedemptions: number;
  systemHealth: 'healthy' | 'degraded' | 'error';
  tierBreakdown: {
    regular: number;
    blend: number;
    barrel: number;
    cellar: number;
    vintage: number;
  };
}

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<LoyaltyStats>({
    totalUsers: 0,
    totalPoints: 0,
    activeRewards: 0,
    pendingRedemptions: 0,
    systemHealth: 'healthy',
    tierBreakdown: {
      regular: 0,
      blend: 0,
      barrel: 0,
      cellar: 0,
      vintage: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoyaltyStats = async () => {
      try {
        setLoading(true);
        
        // Fetch loyalty statistics
        const response = await fetch('/api/loyalty/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching loyalty stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoyaltyStats();
  }, []);

  const managementSections = [
    {
      title: 'User & Points Management',
      description: 'Search users, view balances, and make manual adjustments',
      icon: <UserIcon size={24} />,
      href: '/loyalty/users',
      color: 'bg-[#810000]/10 text-[#810000]'
    },
    {
      title: 'Reward Catalog Management',
      description: 'Add, edit, and manage available rewards',
      icon: <GiftIcon size={24} />,
      href: '/loyalty/rewards',
      color: 'bg-[#ab974f]/10 text-[#ab974f]'
    },
    {
      title: 'Redemption Oversight',
      description: 'Track and manage reward redemptions',
      icon: <CheckCircleIcon size={24} />,
      href: '/loyalty/redemptions',
      color: 'bg-[#810000]/10 text-[#810000]'
    },
    {
      title: 'Sync Monitoring',
      description: 'Monitor order sync and system health',
      icon: <SyncIcon size={24} />,
      href: '/loyalty/sync',
      color: 'bg-[#ab974f]/10 text-[#ab974f]'
    },
    {
      title: 'Settings & Config',
      description: 'Configure points rules and system settings',
      icon: <SettingsIcon size={24} />,
      href: '/loyalty/settings',
      color: 'bg-[#810000]/10 text-[#810000]'
    },
    {
      title: 'Reporting & Analytics',
      description: 'View loyalty program performance metrics',
      icon: <ChartIcon size={24} />,
      href: '/loyalty/analytics',
      color: 'bg-[#ab974f]/10 text-[#ab974f]'
    }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar currentPage="loyalty" showUserInfo={true} />

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">Loyalty Program Management</h2>
              <p className="text-gray-600 text-lg">Manage customer loyalty points, rewards, and program settings.</p>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {/* System Health Status */}
            <div className="mb-8">
              <div className={`tucci-card p-6 border-l-4 ${
                stats.systemHealth === 'healthy' ? 'border-green-500' :
                stats.systemHealth === 'degraded' ? 'border-yellow-500' :
                'border-red-500'
              }`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${
                    stats.systemHealth === 'healthy' ? 'bg-green-100' :
                    stats.systemHealth === 'degraded' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      stats.systemHealth === 'healthy' ? 'bg-green-500' :
                      stats.systemHealth === 'degraded' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">System Status</h3>
                    <p className={`text-sm font-medium ${
                      stats.systemHealth === 'healthy' ? 'text-green-600' :
                      stats.systemHealth === 'degraded' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {stats.systemHealth === 'healthy' ? 'All systems operational' :
                       stats.systemHealth === 'degraded' ? 'Some issues detected' :
                       'System errors detected'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="tucci-card p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-full bg-[#810000]/10">
                      <UserIcon size={24} className="text-[#810000]" />
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
                      <GiftIcon size={24} className="text-[#ab974f]" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Points</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                        ) : (
                          stats.totalPoints.toLocaleString()
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
                      <GiftIcon size={24} className="text-[#810000]" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Rewards</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                        ) : (
                          stats.activeRewards
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
                      <CheckCircleIcon size={24} className="text-[#ab974f]" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Redemptions</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                        ) : (
                          stats.pendingRedemptions
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Breakdown */}
            <div className="mb-8">
              <div className="tucci-card p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-6 tucci-serif">Member Tier Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(stats.tierBreakdown).map(([tier, count]) => (
                    <div key={tier} className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                        tier === 'vintage' ? 'bg-purple-100 text-purple-800' :
                        tier === 'cellar' ? 'bg-yellow-100 text-yellow-800' :
                        tier === 'barrel' ? 'bg-gray-100 text-gray-800' :
                        tier === 'blend' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {tier === 'regular' ? 'Regular Users' :
                         tier.charAt(0).toUpperCase() + tier.slice(1) + ' Members'}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-8 rounded mx-auto"></div>
                        ) : (
                          count.toLocaleString()
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Management Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managementSections.map((section, index) => (
                <Link
                  key={index}
                  href={section.href}
                  className="tucci-card p-6 hover:shadow-lg transition-shadow cursor-pointer group block"
                >
                  <div className="flex items-start">
                    <div className={`p-3 rounded-lg ${section.color} group-hover:scale-110 transition-transform`}>
                      {section.icon}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-[#810000] transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <div className="tucci-card p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-6 tucci-serif">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/loyalty/sync"
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:border-[#810000] hover:bg-[#810000]/5 transition-all"
                  >
                    <SyncIcon size={20} className="text-[#810000] mr-2" />
                    <span className="text-sm font-medium">Run Manual Sync</span>
                  </Link>
                  
                  <Link
                    href="/loyalty/analytics"
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:border-[#810000] hover:bg-[#810000]/5 transition-all"
                  >
                    <ChartIcon size={20} className="text-[#810000] mr-2" />
                    <span className="text-sm font-medium">View Analytics</span>
                  </Link>
                  
                  <Link
                    href="/loyalty/settings"
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:border-[#810000] hover:bg-[#810000]/5 transition-all"
                  >
                    <SettingsIcon size={20} className="text-[#810000] mr-2" />
                    <span className="text-sm font-medium">Configure Settings</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
