'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '../../../../components/DashboardNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const router = useRouter();
  const { userRole, isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState({
    pointsPerDollar: 1,
    minimumRedemption: 100,
    pointsExpiration: 365,
    enableTiers: true,
    blendThreshold: 500,
    barrelThreshold: 1000,
    cellarThreshold: 2500,
    vintageThreshold: 5000
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check if user is system_admin
    if (userRole && !isSuperAdmin) {
      alert('Access Denied: Only System Administrators can access this page.');
      router.push('/loyalty');
      return;
    }
    
    // TODO: Implement settings fetching
    setLoading(false);
  }, [userRole, isSuperAdmin, router]);

  const handleSaveSettings = async () => {
    setSaving(true);
    // TODO: Implement settings save
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  // Show loading or access denied state
  if (!userRole || !isSuperAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <DashboardNavbar currentPage="loyalty" showUserInfo={true} />
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="tucci-card p-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar currentPage="loyalty" showUserInfo={true} />

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">Settings & Configuration</h2>
              <p className="text-gray-600 text-lg">Configure loyalty program rules and system settings.</p>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {/* Points Configuration */}
            <div className="tucci-card p-6 mb-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6 tucci-serif">Points Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points per Dollar Spent
                  </label>
                  <input
                    type="number"
                    value={settings.pointsPerDollar}
                    onChange={(e) => setSettings(prev => ({ ...prev, pointsPerDollar: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Points for Redemption
                  </label>
                  <input
                    type="number"
                    value={settings.minimumRedemption}
                    onChange={(e) => setSettings(prev => ({ ...prev, minimumRedemption: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Expiration (days)
                  </label>
                  <input
                    type="number"
                    value={settings.pointsExpiration}
                    onChange={(e) => setSettings(prev => ({ ...prev, pointsExpiration: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Tier Thresholds */}
            <div className="tucci-card p-6 mb-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6 tucci-serif">Tier Thresholds</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blend Tier (points required)
                  </label>
                  <input
                    type="number"
                    value={settings.blendThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, blendThreshold: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barrel Tier (points required)
                  </label>
                  <input
                    type="number"
                    value={settings.barrelThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, barrelThreshold: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cellar Tier (points required)
                  </label>
                  <input
                    type="number"
                    value={settings.cellarThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, cellarThreshold: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vintage Tier (points required)
                  </label>
                  <input
                    type="number"
                    value={settings.vintageThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, vintageThreshold: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-3 bg-[#810000] text-white rounded-lg hover:bg-[#6d0000] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

