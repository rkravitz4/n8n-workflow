'use client';

import { useState, useEffect } from 'react';
import DashboardNavbar from '../../../../components/DashboardNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';

interface SyncHistory {
  id: string;
  sync_type: string;
  status: string;
  total_orders: number;
  orders_processed: number;
  points_awarded: number;
  phone_verified: number;
  message: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
}

export default function SyncPage() {
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null as string | null,
    status: 'idle' as 'idle' | 'syncing' | 'success' | 'error',
    ordersProcessed: 0,
    pointsAwarded: 0,
    phoneVerified: 0,
    totalOrders: 0,
    message: '',
    skipped: false
  });
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/loyalty/sync/status');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus({
          lastSync: data.lastSync ? new Date(data.lastSync).toLocaleString() : null,
          status: data.status || 'idle',
          ordersProcessed: data.ordersProcessed || 0,
          pointsAwarded: data.pointsAwarded || 0,
          phoneVerified: data.phoneVerified || 0,
          totalOrders: data.totalOrders || 0,
          message: data.message || '',
          skipped: data.skipped || false
        });
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/loyalty/sync/history');
      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data);
      }
    } catch (error) {
      console.error('Error fetching sync history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    fetchSyncHistory();
  }, []);

  const handleManualSync = async () => {
    setSyncStatus(prev => ({ ...prev, status: 'syncing' }));
    
    try {
      const response = await fetch('/api/loyalty/sync/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        setSyncStatus({
          status: 'success',
          lastSync: new Date(result.lastSync).toLocaleString(),
          ordersProcessed: result.ordersProcessed || 0,
          pointsAwarded: result.pointsAwarded || 0,
          phoneVerified: result.phoneVerified || 0,
          totalOrders: result.totalOrders || 0,
          message: result.message || '',
          skipped: result.skipped || false
        });
        
        if (result.skipped) {
          alert(`Sync Status: ${result.message}\n\nBusiness Hours: ${result.businessHours || 'N/A'}\nCurrent Time: ${result.currentTime ? new Date(result.currentTime).toLocaleString() : 'N/A'}\n\nNote: Automatic sync runs every 5 minutes during business hours.`);
        } else {
          alert(`Sync completed successfully!\n\nTotal Orders Found: ${result.totalOrders || 0}\nOrders Processed: ${result.ordersProcessed || 0}\nPoints Awarded: ${result.pointsAwarded || 0}\nPhones Verified: ${result.phoneVerified || 0}\n\nDuration: ${result.duration ? (result.duration / 1000).toFixed(2) + 's' : 'N/A'}`);
        }
        
        // Refresh history after sync
        await fetchSyncHistory();
      } else {
        setSyncStatus(prev => ({ 
          ...prev, 
          status: 'error',
          message: result.error || 'Unknown error'
        }));
        alert(`Sync failed: ${result.error || 'Unknown error'}\n${result.details || ''}`);
      }
    } catch (error) {
      console.error('Error during manual sync:', error);
      setSyncStatus(prev => ({ ...prev, status: 'error' }));
      alert('Error triggering sync. Please try again.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar currentPage="loyalty" showUserInfo={true} />

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">Sync Monitoring</h2>
              <p className="text-gray-600 text-lg">Monitor order synchronization and system health.</p>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {/* Sync Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="tucci-card p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Current Status</div>
                    <div className={`text-lg font-medium ${
                      syncStatus.status === 'success' ? 'text-green-600' :
                      syncStatus.status === 'error' ? 'text-red-600' :
                      syncStatus.status === 'syncing' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {syncStatus.status === 'success' ? 'Synced Successfully' :
                       syncStatus.status === 'error' ? 'Sync Error' :
                       syncStatus.status === 'syncing' ? 'Syncing...' :
                       'Waiting for Sync'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Last Sync</div>
                    <div className="text-lg font-medium text-gray-900">
                      {syncStatus.lastSync || 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="tucci-card p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Statistics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Total Orders Found</div>
                    <div className="text-lg font-medium text-gray-900">{syncStatus.totalOrders}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Orders Processed</div>
                    <div className="text-lg font-medium text-gray-900">{syncStatus.ordersProcessed}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Points Awarded</div>
                    <div className="text-lg font-medium text-gray-900">{syncStatus.pointsAwarded.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phones Verified</div>
                    <div className="text-lg font-medium text-gray-900">{syncStatus.phoneVerified}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Sync */}
            <div className="tucci-card p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Sync</h3>
              <p className="text-gray-600 mb-4">Trigger a manual synchronization of today&apos;s orders from Toast POS.</p>
              <button
                onClick={handleManualSync}
                disabled={syncStatus.status === 'syncing'}
                className="px-6 py-3 bg-[#810000] text-white rounded-lg hover:bg-[#6d0000] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {syncStatus.status === 'syncing' ? 'Syncing...' : 'Run Manual Sync'}
              </button>
            </div>

            {/* How It Works */}
            <div className="tucci-card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How Sync Works</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#810000] text-white flex items-center justify-center text-xs mr-3 mt-0.5">1</div>
                  <div>
                    <strong className="text-gray-900">Automatic Sync:</strong> Runs every 5 minutes during business hours (Weekdays: 11:00AM-10:15PM, Weekends: 9:30AM-10:15PM EST)
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#810000] text-white flex items-center justify-center text-xs mr-3 mt-0.5">2</div>
                  <div>
                    <strong className="text-gray-900">Order Matching:</strong> Matches Toast orders to app users by phone number or email
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#810000] text-white flex items-center justify-center text-xs mr-3 mt-0.5">3</div>
                  <div>
                    <strong className="text-gray-900">Points Award:</strong> Awards 1 point per $1 spent automatically
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#810000] text-white flex items-center justify-center text-xs mr-3 mt-0.5">4</div>
                  <div>
                    <strong className="text-gray-900">Phone Verification:</strong> First order automatically verifies user&apos;s phone number
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#810000] text-white flex items-center justify-center text-xs mr-3 mt-0.5">5</div>
                  <div>
                    <strong className="text-gray-900">Duplicate Prevention:</strong> Each order is only processed once (tracked by order GUID)
                  </div>
                </div>
              </div>
            </div>

            {/* Sync History */}
            <div className="tucci-card p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sync History</h3>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : syncHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {syncHistory.map((sync) => (
                        <tr key={sync.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(sync.started_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sync.sync_type === 'manual' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sync.sync_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sync.status === 'success' ? 'bg-green-100 text-green-800' :
                              sync.status === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {sync.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {sync.total_orders}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {sync.orders_processed}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {sync.points_awarded.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {sync.duration_ms ? `${(sync.duration_ms / 1000).toFixed(2)}s` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No sync history yet. Run a manual sync to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

