'use client';

import { useState, useEffect } from 'react';
import DashboardNavbar from '../../../../components/DashboardNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface UserLoyaltyData {
  user_id: string;
  email: string;
  phone_e164: string;
  current_points: number;
  last_earn_date: string;
  last_redeem_date: string;
  total_orders_earned: number;
  total_rewards_redeemed: number;
  loyalty_tier: string;
  loyalty_enrolled_at: string;
  loyalty_code: string;
  first_name: string;
  last_name: string;
}

interface TransactionHistory {
  id: string;
  delta_points: number;
  reason: string;
  source_order_guid: string;
  source_token: string;
  created_at: string;
}

interface FavoriteDish {
  id: string;
  dish_name: string;
  order_count: number;
  total_spent_cents: number;
  last_ordered_at: string;
}

export default function LoyaltyUsersPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'email' | 'loyalty_code'>('email');
  const [users, setUsers] = useState<UserLoyaltyData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserLoyaltyData | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [favoriteDishes, setFavoriteDishes] = useState<FavoriteDish[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentPoints, setAdjustmentPoints] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');

  // Load users with loyalty codes on page load
  useEffect(() => {
    loadLoyaltyUsers();
  }, []);

  const loadLoyaltyUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/loyalty/users/all');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading loyalty users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/loyalty/users/search?type=${searchType}&term=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/loyalty/users/${userId}/transactions`);
      if (response.ok) {
        const data = await response.json();
        setTransactionHistory(data);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
    }
  };

  const loadFavoriteDishes = async (userId: string) => {
    try {
      const response = await fetch(`/api/loyalty/users/${userId}/favorite-dishes`);
      if (response.ok) {
        const data = await response.json();
        setFavoriteDishes(data);
      }
    } catch (error) {
      console.error('Error loading favorite dishes:', error);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser || !adjustmentPoints || !adjustmentNote) return;

    try {
      const response = await fetch(`/api/loyalty/users/${selectedUser.user_id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delta_points: parseInt(adjustmentPoints),
          note: adjustmentNote,
          admin_user: user?.email
        }),
      });

      if (response.ok) {
        // Refresh user data
        await searchUsers();
        setShowAdjustmentModal(false);
        setAdjustmentPoints('');
        setAdjustmentNote('');
        alert('Points adjustment successful!');
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      alert('Error adjusting points. Please try again.');
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">User & Points Management</h2>
              <p className="text-gray-600 text-lg">Search users and manage their loyalty points and balances.</p>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {/* Search Section */}
            <div className="tucci-card p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Search Users</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'name' | 'email' | 'loyalty_code')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900"
                  >
                    <option value="email">Email Address</option>
                    <option value="loyalty_code">Unique 4-digit Code</option>
                    <option value="name">Name</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search by ${searchType === 'loyalty_code' ? '4-digit code' : searchType}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 placeholder-gray-500"
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  />
                </div>
                <button
                  onClick={searchUsers}
                  disabled={loading || !searchTerm.trim()}
                  className="px-6 py-2 bg-[#810000] text-white rounded-md hover:bg-[#6b0000] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {users.length > 0 && (
              <div className="tucci-card p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Search Results</h3>
                <div className="space-y-4">
                  {users.map((userData) => (
                    <div
                      key={userData.user_id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#810000] cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedUser(userData);
                        loadTransactionHistory(userData.user_id);
                        loadFavoriteDishes(userData.user_id);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{userData.email}</h4>
                          {userData.first_name && userData.last_name && (
                            <p className="text-sm text-gray-900">Name: {userData.first_name} {userData.last_name}</p>
                          )}
                          {userData.loyalty_code && (
                            <p className="text-sm text-gray-900">Code: {userData.loyalty_code}</p>
                          )}
                          {userData.phone_e164 && (
                            <p className="text-sm text-gray-900">Phone: {userData.phone_e164}</p>
                          )}
                          <p className="text-sm text-gray-900">
                            Last Activity: {userData.last_earn_date ? 
                              new Date(userData.last_earn_date).toLocaleDateString() : 
                              'Never'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#810000]">{userData.current_points.toLocaleString()}</p>
                          <p className="text-sm text-gray-900">points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected User Details */}
            {selectedUser && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="tucci-card p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Call tier recalculation function
                          fetch(`/api/loyalty/users/${selectedUser.user_id}/recalculate-tier`, {
                            method: 'POST',
                          }).then(() => {
                            searchUsers();
                            alert('Tier recalculated successfully!');
                          });
                        }}
                        className="px-4 py-2 bg-[#ab974f] text-white rounded-md hover:bg-[#9a8543] text-sm"
                      >
                        Recalculate Tier
                      </button>
                      <button
                        onClick={() => setShowAdjustmentModal(true)}
                        className="px-4 py-2 bg-[#810000] text-white rounded-md hover:bg-[#6b0000] text-sm"
                      >
                        Adjust Points
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    
                    {selectedUser.first_name && selectedUser.last_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                      </div>
                    )}
                    
                    {selectedUser.loyalty_code && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Loyalty Code</label>
                        <p className="text-gray-900 font-mono">{selectedUser.loyalty_code}</p>
                      </div>
                    )}
                    
                    {selectedUser.phone_e164 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{selectedUser.phone_e164}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Current Points</label>
                      <p className="text-2xl font-bold text-[#810000]">{selectedUser.current_points.toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Loyalty Tier</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedUser.loyalty_tier === 'vintage' ? 'bg-purple-100 text-purple-800' :
                          selectedUser.loyalty_tier === 'cellar' ? 'bg-yellow-100 text-yellow-800' :
                          selectedUser.loyalty_tier === 'barrel' ? 'bg-gray-100 text-gray-800' :
                          selectedUser.loyalty_tier === 'blend' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedUser.loyalty_tier === 'regular' ? 'Regular User' :
                           selectedUser.loyalty_tier.charAt(0).toUpperCase() + selectedUser.loyalty_tier.slice(1) + ' Member'}
                        </span>
                        {selectedUser.loyalty_tier !== 'regular' && (
                          <span className="text-xs text-gray-500">
                            Since {new Date(selectedUser.loyalty_enrolled_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Orders Earned</label>
                        <p className="text-gray-900">{selectedUser.total_orders_earned}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Rewards Redeemed</label>
                        <p className="text-gray-900">{selectedUser.total_rewards_redeemed}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Last Earn</label>
                        <p className="text-gray-900">
                          {selectedUser.last_earn_date ? 
                            new Date(selectedUser.last_earn_date).toLocaleDateString() : 
                            'Never'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Last Redeem</label>
                        <p className="text-gray-900">
                          {selectedUser.last_redeem_date ? 
                            new Date(selectedUser.last_redeem_date).toLocaleDateString() : 
                            'Never'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Favorite Dishes */}
                <div className="tucci-card p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Favorite Dishes</h3>
                  <div className="space-y-3">
                    {favoriteDishes.length > 0 ? (
                      favoriteDishes.slice(0, 5).map((dish, index) => (
                        <div key={dish.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#810000] text-white font-bold text-sm">
                                #{index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">{dish.dish_name}</p>
                                <p className="text-sm text-gray-600">
                                  Ordered {dish.order_count} {dish.order_count === 1 ? 'time' : 'times'} · ${(dish.total_spent_cents / 100).toFixed(2)} total
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No favorite dishes tracked yet</p>
                    )}
                  </div>
                </div>

                {/* Transaction History */}
                <div className="tucci-card p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactionHistory.length > 0 ? (
                      transactionHistory.map((transaction) => (
                        <div key={transaction.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{transaction.reason.replace('_', ' ')}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(transaction.created_at).toLocaleDateString()} at{' '}
                                {new Date(transaction.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <p className={`font-medium ${
                              transaction.delta_points > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.delta_points > 0 ? '+' : ''}{transaction.delta_points}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No transaction history found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Points Adjustment Modal */}
        {showAdjustmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adjust Points</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Adjustment (positive to add, negative to subtract)
                  </label>
                  <input
                    type="number"
                    value={adjustmentPoints}
                    onChange={(e) => setAdjustmentPoints(e.target.value)}
                    placeholder="e.g., 100 or -50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason/Note
                  </label>
                  <textarea
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    placeholder="Explain the reason for this adjustment..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustPoints}
                  disabled={!adjustmentPoints || !adjustmentNote}
                  className="px-4 py-2 bg-[#810000] text-white rounded-md hover:bg-[#6b0000] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Adjustment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
