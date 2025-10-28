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
  message?: string;
  error_details?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  business_date?: number;
}

export default function SyncPage() {
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [restaurantGuid, setRestaurantGuid] = useState('679c0b43-458c-47f7-a509-fa0c4b68e447');
  const [businessDate, setBusinessDate] = useState('');
  const [storeId, setStoreId] = useState('151691');

  useEffect(() => {
    fetchSyncHistory();
    
    // Set default business date to today
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    setBusinessDate(dateStr);
  }, []);

  const fetchSyncHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch from toast_sync_history table
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/toast_sync_history?select=*&order=created_at.desc&limit=50`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data);
      }
    } catch (error) {
      console.error('Error fetching sync history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!restaurantGuid.trim() || !businessDate.trim() || businessDate.length !== 8) {
      alert('Please enter valid Restaurant GUID and Business Date (YYYYMMDD format)');
      return;
    }

    if (!confirm(`Start syncing orders for business date ${businessDate}?`)) {
      return;
    }

    setSyncing(true);
    
    try {
      // Call the sync-toast-orders function
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-toast-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          restaurantGuid: restaurantGuid.trim(),
          businessDate: parseInt(businessDate),
          storeId: storeId.trim()
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Sync completed successfully!\n\n` +
              `Orders Processed: ${result.ordersProcessed || 0}\n` +
              `Points Awarded: ${result.pointsAwarded || 0}\n` +
              (result.errors && result.errors.length > 0 ? `\nErrors: ${result.errors.length}` : '')
        );
        
        // Refresh history
        await fetchSyncHistory();
      } else {
        alert(`Sync failed:\n${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      alert(`Error: ${error.message || 'Failed to sync orders'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleScheduledSync = async () => {
    if (!confirm('Run scheduled sync for yesterday and today\'s orders?')) {
      return;
    }

    setSyncing(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scheduled-toast-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Scheduled sync completed!\n\n` +
              `Total Orders Processed: ${result.totalOrdersProcessed || 0}\n` +
              `Total Points Awarded: ${result.totalPointsAwarded || 0}`
        );
        
        await fetchSyncHistory();
      } else {
        alert(`Sync failed:\n${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Scheduled sync error:', error);
      alert(`Error: ${error.message || 'Failed to run scheduled sync'}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatBusinessDate = (businessDate?: number) => {
    if (!businessDate) return 'N/A';
    const str = businessDate.toString();
    return `${str.substring(4, 6)}/${str.substring(6, 8)}/${str.substring(0, 4)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">Toast Order Sync</h2>
              <p className="text-gray-600 text-lg">Monitor and manage Toast POS order synchronization</p>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {/* How It Works - ACCURATE INFO */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How Toast Order Sync Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-900">
                <div>
                  <div className="flex items-start mb-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 mt-0.5 font-bold">1</div>
                    <div>
                      <strong>Automatic Sync:</strong> Runs every 5 minutes between 11am-11pm
                    </div>
                  </div>
                  <div className="flex items-start mb-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 mt-0.5 font-bold">2</div>
                    <div>
                      <strong>Fetch Orders:</strong> Gets orders from Toast POS for yesterday and today
                    </div>
                  </div>
                  <div className="flex items-start mb-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 mt-0.5 font-bold">3</div>
                    <div>
                      <strong>Check Duplicates:</strong> Skips orders already in database
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-start mb-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 mt-0.5 font-bold">4</div>
                    <div>
                      <strong>Extract Loyalty Code:</strong> Finds 4-digit code from "$0 Loyalty Program" discount memo
                    </div>
                  </div>
                  <div className="flex items-start mb-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 mt-0.5 font-bold">5</div>
                    <div>
                      <strong>Award Points:</strong> 1 point per $1 (Cellar tier = 1.5x multiplier!)
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-3 mt-0.5 font-bold">6</div>
                    <div>
                      <strong>Mark Rewards:</strong> Auto-detects used rewards by discount amount
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>✅ New in v3:</strong> Rewards are automatically marked as "spent" when system detects matching discount amounts. 
                  Server only needs to enter customer's loyalty code - no reward tokens needed!
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Scheduled Sync */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Scheduled Sync (Recommended)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Syncs yesterday and today's orders automatically. This is what the cron job runs.
                </p>
                <button
                  onClick={handleScheduledSync}
                  disabled={syncing}
                  className="w-full px-4 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1e40af] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                >
                  {syncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Run Scheduled Sync
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  ⏰ Auto-runs every 5 minutes between 11am-11pm
                </p>
              </div>

              {/* Manual Sync */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Sync (Specific Date)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sync orders for a specific business date
                </p>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Business Date (YYYYMMDD)</label>
                    <input
                      type="text"
                      value={businessDate}
                      onChange={(e) => setBusinessDate(e.target.value)}
                      placeholder="20250117"
                      maxLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="w-full px-4 py-3 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                >
                  {syncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Start Manual Sync
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Configuration Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Restaurant GUID</div>
                  <div className="font-mono text-xs text-gray-900 break-all">{restaurantGuid}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Store ID</div>
                  <div className="font-mono text-xs text-gray-900">{storeId}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Cron Schedule</div>
                  <div className="font-mono text-xs text-gray-900">*/5 11-23 * * *</div>
                  <div className="text-xs text-gray-500 mt-1">Every 5 min, 11am-11pm</div>
                </div>
              </div>
            </div>

            {/* Sync History */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Sync History</h3>
                  <p className="text-sm text-gray-500 mt-1">Recent Toast order synchronizations</p>
                </div>
                <button
                  onClick={fetchSyncHistory}
                  disabled={loading}
                  className="text-[#810000] hover:text-[#6b0000] font-medium text-sm flex items-center"
                >
                  <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#810000] mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading sync history...</p>
                  </div>
                ) : syncHistory.length === 0 ? (
                  <div className="p-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-700 font-medium mb-2">No sync history yet</p>
                    <p className="text-gray-500 text-sm">Run a manual sync to get started</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {syncHistory.map((sync) => (
                        <tr key={sync.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(sync.status)}
                              <span className={`ml-2 text-sm font-medium ${
                                sync.status === 'success' ? 'text-green-700' :
                                sync.status === 'error' ? 'text-red-700' :
                                'text-gray-700'
                              }`}>
                                {sync.status.charAt(0).toUpperCase() + sync.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              sync.sync_type === 'manual' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {sync.sync_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatBusinessDate(sync.business_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sync.started_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sync.orders_processed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#ab974f]">
                            +{sync.points_awarded.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sync.duration_ms ? `${(sync.duration_ms / 1000).toFixed(2)}s` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


