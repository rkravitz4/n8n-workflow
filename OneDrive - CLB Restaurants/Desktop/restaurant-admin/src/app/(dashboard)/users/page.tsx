'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/DashboardNavbar';
import { UsersIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'user' | 'system_admin';
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const { user, signOut, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [originalUsers, setOriginalUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'system_admin'>('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const users: User[] = data.users.map((user: { id: string; email: string; first_name?: string; last_name?: string; role: string; created_at: string; updated_at: string }) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role || 'user',
        created_at: user.created_at,
        updated_at: user.updated_at
      }));

      setUsers(users);
      setOriginalUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: 'admin' | 'user' | 'system_admin') => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    );
    setUsers(updatedUsers);
    
    // Check if there are any changes
    const hasChanges = updatedUsers.some((updatedUser, index) => 
      updatedUser.role !== originalUsers[index]?.role
    );
    setHasChanges(hasChanges);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Find users that have changed roles
      const changedUsers = users.filter((user, index) => 
        user.role !== originalUsers[index]?.role
      );

      // Update each changed user
      const updatePromises = changedUsers.map(async user => {
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('No valid session found');
        }

        return fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ role: user.role }),
        });
      });

      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const failedUpdates = results.filter(result => !result.ok);
      if (failedUpdates.length > 0) {
        throw new Error('Some updates failed');
      }
      
      // Update the original users to match current state
      setOriginalUsers([...users]);
      setHasChanges(false);
      
      // Show success toast
      showToast('User roles updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving user roles:', error);
      showToast('Failed to save changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChanges = () => {
    setUsers([...originalUsers]);
    setHasChanges(false);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setShowUserDetails(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'system_admin': return 'bg-purple-100 text-purple-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'system_admin': return 'System Administrator';
      case 'user': return 'User';
      default: return role;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <DashboardNavbar currentPage="users" showUserInfo={true} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Clean Header */}
            <div className="mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1 tucci-serif">User Management</h2>
                <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {/* Role Permissions Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-2">Regular User</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• View events and notifications in mobile app</li>
                    <li>• No access to webapp features</li>
                  </ul>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-2">Admin</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Manage events and notifications</li>
                    <li>• View analytics and statistics</li>
                    <li>• Full access to webapp management features</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-2">System Administrator</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• All Admin permissions</li>
                    <li>• Manage users and change user roles</li>
                    <li>• Full system access and control</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Compact Role Legend */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Role Types</h3>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Regular User</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Admin</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-sm text-gray-600">System Administrator</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 placeholder:text-gray-500"
                    placeholder="Search by name or email..."
                  />
                </div>
                <div className="sm:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user' | 'system_admin')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="user">Users</option>
                    <option value="system_admin">System Administrators</option>
                  </select>
                </div>
                {hasChanges && (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelChanges}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="px-4 py-2 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors disabled:opacity-50 flex items-center"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Unsaved Changes Warning */}
              {hasChanges && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-amber-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    You have unsaved changes
                  </div>
                </div>
              )}
            </div>

            {/* Users List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="tucci-card p-6">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="tucci-card p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}` 
                              : user.email}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{user.email}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                          {user.updated_at && (
                            <span>Last updated: {new Date(user.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {isSuperAdmin ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user' | 'system_admin')}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 bg-white"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="system_admin">System Administrator</option>
                          </select>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                            {getRoleDisplayName(user.role)}
                          </span>
                        )}
                        <button 
                          onClick={() => handleViewDetails(user)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="tucci-card p-12 text-center">
                    <UsersIcon size={48} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            )}

            {/* User Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="tucci-card p-6 text-center">
                <div className="p-3 rounded-full bg-[#810000]/10 w-fit mx-auto mb-4">
                  <UsersIcon size={24} className="text-[#810000]" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">{users.length}</h4>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
              <div className="tucci-card p-6 text-center">
                <div className="p-3 rounded-full bg-[#ab974f]/10 w-fit mx-auto mb-4">
                  <UsersIcon size={24} className="text-[#ab974f]" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">
                  {users.filter(u => u.role === 'admin' || u.role === 'system_admin').length}
                </h4>
                <p className="text-sm text-gray-600">Admins</p>
              </div>
              <div className="tucci-card p-6 text-center">
                <div className="p-3 rounded-full bg-[#810000]/10 w-fit mx-auto mb-4">
                  <UsersIcon size={24} className="text-[#810000]" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">
                  {users.filter(u => u.role === 'user').length}
                </h4>
                <p className="text-sm text-gray-600">Regular Users</p>
              </div>
              <div className="tucci-card p-6 text-center">
                <div className="p-3 rounded-full bg-[#ab974f]/10 w-fit mx-auto mb-4">
                  <UsersIcon size={24} className="text-[#ab974f]" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">
                  {users.filter(u => {
                    if (!u.updated_at) return false;
                    const lastUpdate = new Date(u.updated_at);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return lastUpdate > weekAgo;
                  }).length}
                </h4>
                <p className="text-sm text-gray-600">Active This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
                  <button
                    onClick={closeUserDetails}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900">
                      {selectedUser.first_name && selectedUser.last_name 
                        ? `${selectedUser.first_name} ${selectedUser.last_name}` 
                        : 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                        {getRoleDisplayName(selectedUser.role)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                    <p className="text-gray-900">
                      {new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Sign In</label>
                    <p className="text-gray-900">
                      {selectedUser.updated_at 
                        ? new Date(selectedUser.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <p className="text-gray-500 text-sm font-mono">{selectedUser.id}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeUserDetails}
                    className="px-4 py-2 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
