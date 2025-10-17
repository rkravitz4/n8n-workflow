'use client';

import { useState, useEffect } from 'react';
import DashboardNavbar from '../../../../components/DashboardNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function LoyaltyAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pointsIssued: 0,
    pointsRedeemed: 0,
    redemptionRate: 0,
    averagePointsPerMember: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement analytics fetching
    setLoading(false);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar currentPage="loyalty" showUserInfo={true} />

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">Loyalty Analytics</h2>
              <p className="text-gray-600 text-lg">View loyalty program performance metrics and insights.</p>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="tucci-card p-6">
                <div className="text-sm text-gray-500 mb-2">Total Members</div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-9 w-20 rounded"></div>
                  ) : (
                    analytics.totalMembers.toLocaleString()
                  )}
                </div>
              </div>

              <div className="tucci-card p-6">
                <div className="text-sm text-gray-500 mb-2">Active Members (30 days)</div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-9 w-20 rounded"></div>
                  ) : (
                    analytics.activeMembers.toLocaleString()
                  )}
                </div>
              </div>

              <div className="tucci-card p-6">
                <div className="text-sm text-gray-500 mb-2">Redemption Rate</div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-9 w-20 rounded"></div>
                  ) : (
                    `${analytics.redemptionRate.toFixed(1)}%`
                  )}
                </div>
              </div>

              <div className="tucci-card p-6">
                <div className="text-sm text-gray-500 mb-2">Points Issued</div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-9 w-24 rounded"></div>
                  ) : (
                    analytics.pointsIssued.toLocaleString()
                  )}
                </div>
              </div>

              <div className="tucci-card p-6">
                <div className="text-sm text-gray-500 mb-2">Points Redeemed</div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-9 w-24 rounded"></div>
                  ) : (
                    analytics.pointsRedeemed.toLocaleString()
                  )}
                </div>
              </div>

              <div className="tucci-card p-6">
                <div className="text-sm text-gray-500 mb-2">Avg. Points per Member</div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-9 w-20 rounded"></div>
                  ) : (
                    analytics.averagePointsPerMember.toLocaleString()
                  )}
                </div>
              </div>
            </div>

            {/* Charts Placeholder */}
            <div className="tucci-card p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6 tucci-serif">Performance Over Time</h3>
              <div className="text-center py-12 text-gray-500">
                <p>Charts and detailed analytics coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

