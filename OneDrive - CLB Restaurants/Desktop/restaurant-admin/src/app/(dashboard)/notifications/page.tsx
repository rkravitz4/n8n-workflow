'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/DashboardNavbar';
import { NotificationsIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/contexts/ToastContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  target_audience: 'all' | 'admins' | 'users' | 'system_admin';
  sent_at: string;
  sent_by: string;
  tokens_sent?: number;
  expo_response?: any;
  deep_link?: string | null;
  profiles?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function NotificationsPage() {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    target_audience: 'all' as 'all' | 'admins' | 'users',
    deep_link: '',
    scheduledTime: ''
  });

  const [statsModal, setStatsModal] = useState<{
    isOpen: boolean;
    notification: Notification | null;
  }>({ isOpen: false, notification: null });

  const [scheduleModal, setScheduleModal] = useState<{
    isOpen: boolean;
    notification: Notification | null;
    scheduledTime: string;
  }>({ isOpen: false, notification: null, scheduledTime: '' });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast('Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  };



  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSending(true);
      
      // Determine if this should be scheduled or sent immediately
      const isScheduled = newNotification.scheduledTime && new Date(newNotification.scheduledTime) > new Date();
      const endpoint = isScheduled ? '/api/notifications/schedule' : '/api/notifications/send';
      
      const requestBody = {
        title: newNotification.title,
        message: newNotification.message,
        targetAudience: newNotification.target_audience,
        deep_link: newNotification.deep_link || null,
        sentBy: user?.id,
        ...(isScheduled && { scheduledTime: newNotification.scheduledTime })
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (isScheduled) {
          showToast(`Notification scheduled for ${new Date(newNotification.scheduledTime).toLocaleString()}`, 'success');
        } else {
          // Check if push notification was actually successful
          if (data.pushResult && data.pushResult.success) {
            showToast(`Notification sent successfully to ${data.pushResult.tokensSent || 0} devices!`, 'success');
          } else if (data.warning) {
            showToast(`Notification saved but push delivery failed: ${data.message}`, 'warning');
          } else {
            showToast('Notification saved but failed to send to devices. Check your push token configuration.', 'warning');
          }
        }
        
        // Refresh notifications list
        await fetchNotifications();
        
        // Reset form
        setNewNotification({
          title: '',
          message: '',
          target_audience: 'all',
          deep_link: '',
          scheduledTime: ''
        });
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        showToast(errorData.message || errorData.error || 'Failed to send notification', 'error');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      showToast(error instanceof Error ? error.message : 'Failed to send notification', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleViewStats = (notification: Notification) => {
    setStatsModal({ isOpen: true, notification });
  };

  const handleResendNotification = async (notification: Notification) => {
    try {
      setSending(true);
      
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          targetAudience: notification.target_audience,
          deep_link: notification.deep_link || null,
          sentBy: user?.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if push notification was actually successful
        if (data.pushResult && data.pushResult.success) {
          showToast(`Notification "${notification.title}" resent successfully to ${data.pushResult.tokensSent || 0} devices!`, 'success');
        } else if (data.warning) {
          showToast(`Notification "${notification.title}" saved but push delivery failed: ${data.message}`, 'warning');
        } else {
          showToast(`Notification "${notification.title}" saved but failed to send to devices. Check your push token configuration.`, 'warning');
        }
        
        // Refresh notifications list
        await fetchNotifications();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || errorData.error || 'Failed to resend notification', 'error');
      }
    } catch (error) {
      console.error('Error resending notification:', error);
      showToast(error instanceof Error ? error.message : 'Failed to resend notification', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleScheduleNotification = (notification: Notification) => {
    // Set default time to 1 hour from now
    const defaultTime = new Date();
    defaultTime.setHours(defaultTime.getHours() + 1);
    const timeString = defaultTime.toISOString().slice(0, 16); // Format for datetime-local input
    
    setScheduleModal({ 
      isOpen: true, 
      notification, 
      scheduledTime: timeString 
    });
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleModal.notification || !scheduleModal.scheduledTime) return;
    
    try {
      setSending(true);
      
      const response = await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: scheduleModal.notification.title,
          message: scheduleModal.notification.message,
          targetAudience: scheduleModal.notification.target_audience,
          deep_link: scheduleModal.notification.deep_link || null,
          sentBy: user?.id,
          scheduledTime: scheduleModal.scheduledTime
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(`Notification "${scheduleModal.notification.title}" scheduled for ${new Date(scheduleModal.scheduledTime).toLocaleString()}`, 'success');
        
        // Close modal and refresh notifications list
        setScheduleModal({ isOpen: false, notification: null, scheduledTime: '' });
        await fetchNotifications();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule notification');
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      showToast(error instanceof Error ? error.message : 'Failed to schedule notification', 'error');
    } finally {
      setSending(false);
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'all': return 'bg-blue-100 text-blue-800';
      case 'admins': return 'bg-red-100 text-red-800';
      case 'users': return 'bg-green-100 text-green-800';
      case 'system_admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <DashboardNavbar currentPage="notifications" showUserInfo={true} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2 tucci-serif">Push Notifications</h2>
                  <p className="text-gray-600 text-lg">Send targeted notifications to your app users about events, promotions, and updates.</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="tucci-button-primary px-6 py-3"
                >
                  + Send Notification
                </button>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {/* Send Notification Form */}
            {showCreateForm && (
              <div className="tucci-card p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Send New Notification</h3>
                
                {/* Push Token Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Push Notifications Setup</h4>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>To send push notifications, users need to:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Install the mobile app from TestFlight</li>
                          <li>Log in to their account</li>
                          <li>Enable notifications when prompted</li>
                        </ul>
                        <p className="mt-2 font-medium">Check the notification list below to see current push token status.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title</label>
                    <input
                      type="text"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 placeholder:text-gray-500"
                      placeholder="e.g., New Wine Tasting Event"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 placeholder:text-gray-500"
                      placeholder="Enter your notification message here..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                    <select
                      value={newNotification.target_audience}
                      onChange={(e) => setNewNotification({...newNotification, target_audience: e.target.value as 'all' | 'admins' | 'users' | 'system_admin'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 bg-white"
                    >
                      <option value="all">All Users</option>
                      <option value="users">Regular Users Only</option>
                      <option value="admins">Admins Only</option>
                      <option value="system_admin">System Admins Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">App Page (Optional)</label>
                    <p className="text-xs text-gray-500 mb-2">Select which page opens when users tap the notification</p>
                    <select
                      value={newNotification.deep_link}
                      onChange={(e) => setNewNotification({...newNotification, deep_link: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900 bg-white"
                    >
                      <option value="">No page (notification only)</option>
                      <optgroup label="Menus">
                        <option value="/lunch-menu">Lunch Menu</option>
                        <option value="/dinner-menu">Dinner Menu</option>
                        <option value="/happy-hour-menu">Happy Hour Menu</option>
                        <option value="/bar-bites-menu">Bar Bites Menu</option>
                        <option value="/brunch-menu">Brunch Menu</option>
                        <option value="/wine-list">Wine List</option>
                        <option value="/cocktail-menu">Cocktail Menu</option>
                      </optgroup>
                      <optgroup label="Special Events">
                        <option value="/private-dining">Private Dining</option>
                        <option value="/catering">Catering</option>
                        <option value="/wine-tastings">Wine Tastings</option>
                        <option value="/live-music">Live Music Schedule</option>
                      </optgroup>
                      <optgroup label="Information">
                        <option value="/about">About Us</option>
                        <option value="/location">Location & Hours</option>
                        <option value="/contact">Contact Us</option>
                        <option value="/gift-cards">Gift Cards</option>
                      </optgroup>
                      <optgroup label="Reservations">
                        <option value="/reservations">Make a Reservation</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule (Optional)</label>
                    <input
                      type="datetime-local"
                      value={newNotification.scheduledTime}
                      onChange={(e) => setNewNotification({...newNotification, scheduledTime: e.target.value})}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900"
                      placeholder="Leave empty to send immediately"
                    />
                    <p className="text-sm text-gray-500 mt-1">Leave empty to send immediately, or set a future date/time to schedule</p>
                  </div>
                  <div className="flex space-x-4">
                    <button 
                      type="submit" 
                      disabled={sending}
                      className="tucci-button-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {sending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Send Notification'
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateForm(false)}
                      className="tucci-button-secondary px-6 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications List */}
            {loading ? (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
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
              <div className="space-y-6">
                {notifications.map((notification) => (
                  <div key={notification.id} className="tucci-card p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{notification.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAudienceColor(notification.target_audience)}`}>
                            {notification.target_audience === 'all' ? 'All Users' : 
                             notification.target_audience === 'admins' ? 'Admins Only' : 
                             notification.target_audience === 'system_admin' ? 'System Admins Only' : 'Users Only'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{notification.message}</p>
                        
                        {notification.deep_link && (
                          <div className="mb-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              📱 Opens: {notification.deep_link.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Sent: {new Date(notification.sent_at).toLocaleString()}</span>
                          <span>By: {notification.profiles?.email || notification.sent_by}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {notification.tokens_sent || 0} devices
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button 
                          onClick={() => handleViewStats(notification)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          View Stats
                        </button>
                        <button 
                          onClick={() => handleScheduleNotification(notification)}
                          className="px-4 py-2 bg-[#ab974f] text-white rounded-lg text-sm font-medium hover:bg-[#9a8646] transition-colors"
                        >
                          Schedule
                        </button>
                        <button 
                          onClick={() => handleResendNotification(notification)}
                          disabled={sending}
                          className="px-4 py-2 bg-[#810000] text-white rounded-lg text-sm font-medium hover:bg-[#6b0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sending ? 'Sending...' : 'Resend'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length === 0 && (
                  <div className="tucci-card p-12 text-center">
                    <NotificationsIcon size={48} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications sent yet</h3>
                    <p className="text-gray-600 mb-4">Send your first notification to engage with your users.</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="tucci-button-primary px-6 py-3"
                    >
                      Send Your First Notification
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notification Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="tucci-card p-6 text-center">
                <div className="p-3 rounded-full bg-[#810000]/10 w-fit mx-auto mb-4">
                  <NotificationsIcon size={24} className="text-[#810000]" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">{notifications.length}</h4>
                <p className="text-sm text-gray-600">Total Notifications Sent</p>
              </div>
              <div className="tucci-card p-6 text-center">
                <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">Mobile App</h4>
                <p className="text-sm text-gray-600">Push notifications require users to enable notifications in the mobile app</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Modal */}
        {statsModal.isOpen && statsModal.notification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900 tucci-serif">Notification Statistics</h2>
                <button
                  onClick={() => setStatsModal({ isOpen: false, notification: null })}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <p className="text-lg font-semibold text-gray-900">{statsModal.notification.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAudienceColor(statsModal.notification.target_audience)}`}>
                        {statsModal.notification.target_audience === 'all' ? 'All Users' : 
                         statsModal.notification.target_audience === 'admins' ? 'Admins Only' : 
                         statsModal.notification.target_audience === 'system_admin' ? 'System Admins Only' : 'Users Only'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{statsModal.notification.message}</p>
                  </div>
                  
                  {statsModal.notification.deep_link && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">App Page</label>
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                        📱 {statsModal.notification.deep_link.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sent Date</label>
                      <p className="text-gray-900">{new Date(statsModal.notification.sent_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Devices Reached</label>
                      <p className="text-2xl font-bold text-[#810000]">{statsModal.notification.tokens_sent || 0}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sent By</label>
                      <p className="text-gray-900">{statsModal.notification.profiles?.email || statsModal.notification.sent_by}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {scheduleModal.isOpen && scheduleModal.notification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900 tucci-serif">Schedule Notification</h2>
                <button
                  onClick={() => setScheduleModal({ isOpen: false, notification: null, scheduledTime: '' })}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
                    <p className="text-lg font-semibold text-gray-900">{scheduleModal.notification.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{scheduleModal.notification.message}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduleModal.scheduledTime}
                      onChange={(e) => setScheduleModal({ ...scheduleModal, scheduledTime: e.target.value })}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">Notifications will be sent at the scheduled time</p>
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <button 
                      onClick={handleScheduleSubmit}
                      disabled={sending || !scheduleModal.scheduledTime}
                      className="tucci-button-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {sending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Scheduling...
                        </>
                      ) : (
                        'Schedule Notification'
                      )}
                    </button>
                    <button 
                      onClick={() => setScheduleModal({ isOpen: false, notification: null, scheduledTime: '' })}
                      className="tucci-button-secondary px-6 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
