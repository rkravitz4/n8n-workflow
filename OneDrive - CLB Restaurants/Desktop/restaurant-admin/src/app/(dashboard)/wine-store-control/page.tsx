'use client';

import { useState, useEffect } from 'react';
import DashboardNavbar from '@/components/DashboardNavbar';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function WineStoreControlPage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [wineStoreDisabled, setWineStoreDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadWineStoreStatus();
  }, []);

  const loadWineStoreStatus = async () => {
    try {
      setLoading(true);
      console.log('=== LOADING WINE STORE STATUS ===');
      
      const response = await fetch('/api/wine-store-status');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error loading wine store status:', errorData);
        return;
      }

      const data = await response.json();
      console.log('Wine store status API result:', data);

      setWineStoreDisabled(data.isDisabled);
    } catch (error) {
      console.error('Error loading wine store status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWineStore = async () => {
    try {
      setUpdating(true);
      const newStatus = !wineStoreDisabled;
      
      console.log('=== TOGGLING WINE STORE ===');
      console.log('Current status:', wineStoreDisabled);
      console.log('New status:', newStatus);

      const response = await fetch('/api/wine-store-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDisabled: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating wine store status:', errorData);
        alert('Failed to update wine store status');
        return;
      }

      const data = await response.json();
      console.log('Wine store status update result:', data);

      setWineStoreDisabled(newStatus);
      console.log('Wine store status updated successfully');
      
      alert(data.message);
    } catch (error) {
      console.error('Error toggling wine store:', error);
      alert('Failed to toggle wine store status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <DashboardNavbar currentPage="wine-store-control" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#810000] mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Wine Store Status</h2>
              <p className="text-gray-600">Fetching current status...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar currentPage="wine-store-control" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">Wine Store Control</h1>
            <p className="text-gray-600">
              Enable or disable access to the retail wine store for all users. When disabled, users will see a maintenance message instead of the wine store.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="tucci-card p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6 tucci-serif">Wine Store Access Control</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Wine Store Access</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Current status: <span className={`font-medium ${wineStoreDisabled ? 'text-red-600' : 'text-green-600'}`}>
                        {wineStoreDisabled ? 'Disabled' : 'Enabled'}
                      </span>
                    </p>
                  </div>
                  
                  <button
                    onClick={toggleWineStore}
                    disabled={updating}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#810000] focus:ring-offset-2 ${
                      wineStoreDisabled ? 'bg-red-600' : 'bg-green-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        wineStoreDisabled ? 'translate-x-1' : 'translate-x-6'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${wineStoreDisabled ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className={`text-sm font-medium ${wineStoreDisabled ? 'text-red-600' : 'text-green-600'}`}>
                    {wineStoreDisabled ? 'Store Disabled' : 'Store Enabled'}
                  </span>
                </div>

                {updating && (
                  <div className="text-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-[#810000] mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Updating...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="tucci-card p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6 tucci-serif">Important Notes</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-[#810000] rounded-full mt-2"></div>
                  <p className="text-gray-600 text-sm">
                    When disabled, users will see a maintenance message instead of the wine store
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-[#810000] rounded-full mt-2"></div>
                  <p className="text-gray-600 text-sm">
                    This setting affects all users immediately
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-[#810000] rounded-full mt-2"></div>
                  <p className="text-gray-600 text-sm">
                    Users can still access other parts of the app
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-[#810000] rounded-full mt-2"></div>
                  <p className="text-gray-600 text-sm">
                    You can re-enable the store at any time
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 tucci-card p-6">
            <h3 className="text-xl font-medium text-gray-900 mb-4 tucci-serif">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh Status
              </button>
              <button
                onClick={toggleWineStore}
                disabled={updating}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  wineStoreDisabled 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? 'Updating...' : wineStoreDisabled ? 'Enable Store' : 'Disable Store'}
              </button>
              <a
                href="/dashboard"
                className="px-4 py-2 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors text-center"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
