'use client';

import { useState, useEffect } from 'react';
import DashboardNavbar from '../../../../components/DashboardNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import RewardImageUpload from '@/components/RewardImageUpload';

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  value_cents: number;
  reward_type: string;
  brand: string;
  active: boolean;
  image_url?: string;
  free_item_name?: string;
  created_at: string;
  updated_at?: string;
}

// Common reward templates for quick creation
const REWARD_TEMPLATES = [
  { name: '$5 Off', description: '$5 discount on your order', points_cost: 500, value_cents: 500, reward_type: 'dollar_off' },
  { name: '$10 Off', description: '$10 discount on your order', points_cost: 1000, value_cents: 1000, reward_type: 'dollar_off' },
  { name: '$15 Off', description: '$15 discount on your order', points_cost: 1500, value_cents: 1500, reward_type: 'dollar_off' },
  { name: '$20 Off', description: '$20 discount on your order', points_cost: 2000, value_cents: 2000, reward_type: 'dollar_off' },
  { name: 'Free Appetizer', description: 'Complimentary appetizer of your choice', points_cost: 750, value_cents: 1500, reward_type: 'free_item' },
  { name: 'Free Dessert', description: 'Complimentary dessert of your choice', points_cost: 500, value_cents: 1000, reward_type: 'free_item' },
];

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_cost: '',
    value_cents: '',
    reward_type: 'dollar_off',
    brand: 'tuccis',
    active: true,
    image_url: '',
    free_item_name: ''
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/loyalty/rewards');
      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const method = editingReward ? 'PUT' : 'POST';
      const url = editingReward ? `/api/loyalty/rewards/${editingReward.id}` : '/api/loyalty/rewards';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          points_cost: parseInt(formData.points_cost),
          value_cents: formData.reward_type === 'free_item' ? 0 : parseInt(formData.value_cents),
        }),
      });

      if (response.ok) {
        await fetchRewards();
        setShowModal(false);
        resetForm();
        // Success handled by UI feedback
      } else {
        const error = await response.json();
        console.error(`Error: ${error.error || 'Failed to save reward'}`);
      }
    } catch (error) {
      console.error('Error saving reward:', error);
      console.error('Error saving reward. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      points_cost: '',
      value_cents: '',
      reward_type: 'dollar_off',
      brand: 'tuccis',
      active: true,
      image_url: '',
      free_item_name: ''
    });
    setEditingReward(null);
    setShowPreview(false);
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      points_cost: reward.points_cost.toString(),
      value_cents: reward.reward_type === 'percent_off' ? reward.value_cents.toString() : reward.value_cents.toString(),
      reward_type: reward.reward_type,
      brand: reward.brand,
      active: reward.active,
      image_url: reward.image_url || '',
      free_item_name: reward.free_item_name || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (reward: Reward) => {
    if (confirm(`Are you sure you want to delete "${reward.name}"? This cannot be undone.`)) {
      try {
        const response = await fetch(`/api/loyalty/rewards/${reward.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchRewards();
          // Success handled by UI feedback
        }
      } catch (error) {
        console.error('Error deleting reward:', error);
        console.error('Error deleting reward');
      }
    }
  };

  const handleToggleActive = async (reward: Reward) => {
    try {
      const response = await fetch(`/api/loyalty/rewards/${reward.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reward,
          active: !reward.active,
        }),
      });

      if (response.ok) {
        await fetchRewards();
      }
    } catch (error) {
      console.error('Error toggling reward status:', error);
      console.error('Error updating reward status');
    }
  };

  const applyTemplate = (template: typeof REWARD_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      points_cost: template.points_cost.toString(),
      value_cents: template.value_cents.toString(),
      reward_type: template.reward_type,
    });
    setShowTemplates(false);
  };

  const getDisplayValue = (reward: Reward) => {
    if (reward.reward_type === 'dollar_off') {
      return `$${(reward.value_cents / 100).toFixed(2)}`;
    } else if (reward.reward_type === 'percent_off') {
      return `${reward.value_cents}%`;
    } else {
      return `$${(reward.value_cents / 100).toFixed(2)} value`;
    }
  };

  const getCurrentDisplayValue = () => {
    if (formData.reward_type === 'free_item') {
      return formData.free_item_name ? `Free ${formData.free_item_name}` : 'Free Item';
    }
    
    const value = parseInt(formData.value_cents) || 0;
    if (formData.reward_type === 'dollar_off') {
      return `$${(value / 100).toFixed(2)} Off`;
    } else if (formData.reward_type === 'percent_off') {
      return `${value}% Off`;
    } else {
      return `$${(value / 100).toFixed(2)} Off`;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 tucci-serif">Reward Catalog Management</h1>
              <p className="mt-2 text-gray-600">Manage rewards that customers can redeem with their loyalty points</p>
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <h3 className="text-sm font-medium text-blue-900 mb-1">💡 How Rewards Work in the Mobile App:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Customers have a unique 4-digit loyalty code displayed in the app</li>
                  <li>• Server enters customer's 4-digit loyalty code in Toast POS as a discount</li>
                  <li>• System automatically syncs orders and tracks rewards redemption</li>
                  <li>• New members receive a $15 Welcome Reward upon enrollment</li>
                  <li>• Customers earn points on orders (even when using rewards!)</li>
                </ul>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600">Total Rewards</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{rewards.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600">Active Rewards</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {rewards.filter(r => r.active).length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600">With Images</div>
                <div className="text-3xl font-bold text-[#ab974f] mt-2">
                  {rewards.filter(r => r.image_url).length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600">Avg Points Cost</div>
                <div className="text-3xl font-bold text-[#810000] mt-2">
                  {rewards.length > 0 ? Math.round(rewards.reduce((sum, r) => sum + r.points_cost, 0) / rewards.length) : 0}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Rewards Catalog</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage what customers can redeem in the mobile app</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        resetForm();
                        setShowTemplates(true);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Use Template
                    </button>
                    <button
                      onClick={() => {
                        resetForm();
                        setShowModal(true);
                      }}
                      className="px-4 py-2 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Reward
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#810000] mb-4"></div>
                            <p className="text-gray-500">Loading rewards...</p>
                          </div>
                        </td>
                      </tr>
                    ) : rewards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                            <p className="text-gray-700 font-medium mb-2">No rewards in catalog yet</p>
                            <p className="text-gray-500 text-sm mb-4">Get started by creating your first reward or using a template</p>
                            <button
                              onClick={() => {
                                resetForm();
                                setShowModal(true);
                              }}
                              className="px-4 py-2 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors"
                            >
                              Create First Reward
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rewards.map((reward) => (
                        <tr key={reward.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {reward.image_url ? (
                                <img
                                  className="h-16 w-16 rounded-lg object-cover mr-4 border-2 border-gray-200"
                                  src={reward.image_url}
                                  alt={reward.name}
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-lg bg-gray-100 mr-4 flex items-center justify-center border-2 border-gray-200">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{reward.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {reward.reward_type === 'dollar_off' && '$ Discount'}
                              {reward.reward_type === 'percent_off' && '% Discount'}
                              {reward.reward_type === 'free_item' && (reward.free_item_name ? `Free ${reward.free_item_name}` : 'Free Item')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{reward.points_cost.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">points</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-[#810000]">
                              {getDisplayValue(reward)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleActive(reward)}
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                                reward.active 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {reward.active ? '✓ Active' : '○ Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(reward)}
                              className="text-[#810000] hover:text-[#6b0000] mr-4 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(reward)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Templates Modal */}
            {showTemplates && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-3xl">
                  <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 tucci-serif">
                      Choose a Template
                    </h3>
                    <button
                      onClick={() => setShowTemplates(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {REWARD_TEMPLATES.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            applyTemplate(template);
                            setShowModal(true);
                          }}
                          className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-[#810000] hover:bg-[#810000]/5 transition-all"
                        >
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">{template.points_cost} points</span>
                            <span className="text-sm font-semibold text-[#810000]">
                              ${(template.value_cents / 100).toFixed(2)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => {
                          setShowTemplates(false);
                          setShowModal(true);
                        }}
                        className="text-[#810000] hover:text-[#6b0000] text-sm font-medium"
                      >
                        Or create custom reward →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 tucci-serif">
                        {editingReward ? 'Edit Reward' : 'Add New Reward'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {editingReward ? 'Update reward details below' : 'Create a new reward for the mobile app'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Form Column */}
                    <div className="lg:col-span-2">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reward Name *
                              </label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., $10 Off Your Order"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent text-gray-900 placeholder-gray-500"
                              />
                              <p className="text-xs text-gray-900 mt-1">This appears as the main title in the mobile app</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                              </label>
                              <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                rows={3}
                                placeholder="e.g., Save $10 on any order at Tucci's"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent text-gray-900 placeholder-gray-500"
                              />
                              <p className="text-xs text-gray-900 mt-1">Describe the reward clearly for customers</p>
                            </div>
                          </div>
                        </div>

                        {/* Reward Configuration */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-4">Reward Configuration</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reward Type *
                              </label>
                              <select
                                value={formData.reward_type}
                                onChange={(e) => setFormData({ ...formData, reward_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent text-gray-900"
                              >
                                <option value="dollar_off">💵 Dollar Amount Off</option>
                                <option value="percent_off">📊 Percentage Off</option>
                                <option value="free_item">🎁 Free Menu Item</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Points Required *
                              </label>
                              <input
                                type="number"
                                value={formData.points_cost}
                                onChange={(e) => setFormData({ ...formData, points_cost: e.target.value })}
                                required
                                min="1"
                                step="1"
                                placeholder="e.g., 1000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent text-gray-900 placeholder-gray-500"
                              />
                              <p className="text-xs text-gray-900 mt-1">How many points to redeem</p>
                            </div>
                          </div>

                          {formData.reward_type === 'free_item' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Free Item Name *
                              </label>
                              <input
                                type="text"
                                value={formData.free_item_name}
                                onChange={(e) => setFormData({ ...formData, free_item_name: e.target.value })}
                                required={formData.reward_type === 'free_item'}
                                placeholder="e.g., Dessert, Appetizer, Salad"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent text-gray-900 placeholder-gray-500"
                              />
                              <p className="text-xs text-gray-900 mt-1">This will display as "Free [Item Name]" in the app</p>
                            </div>
                          )}

                          {formData.reward_type !== 'free_item' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {formData.reward_type === 'dollar_off' && 'Discount Amount *'}
                                {formData.reward_type === 'percent_off' && 'Percentage Off *'}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={formData.value_cents}
                                  onChange={(e) => setFormData({ ...formData, value_cents: e.target.value })}
                                  required
                                  min="1"
                                  step={formData.reward_type === 'percent_off' ? '1' : '1'}
                                  placeholder={
                                    formData.reward_type === 'dollar_off' ? '1000 (= $10.00)' :
                                    formData.reward_type === 'percent_off' ? '10 (= 10%)' :
                                    '1000 (= $10.00)'
                                  }
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent text-gray-900 placeholder-gray-500"
                                />
                                <div className="absolute right-3 top-2 text-sm text-gray-400 pointer-events-none">
                                  {formData.reward_type === 'dollar_off' && 'cents'}
                                  {formData.reward_type === 'percent_off' && '%'}
                                </div>
                              </div>
                              <p className="text-xs text-gray-900 mt-1">
                                {formData.reward_type === 'dollar_off' && 'Enter in cents (e.g., 1000 = $10.00)'}
                                {formData.reward_type === 'percent_off' && 'Enter percentage (e.g., 10 = 10% off)'}
                              </p>
                              {formData.value_cents && (
                                <div className="mt-2 p-2 bg-[#ab974f]/10 rounded-lg">
                                  <p className="text-sm font-medium text-[#ab974f]">
                                    Displays as: {getCurrentDisplayValue()}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Image Upload */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-4">Reward Image (Optional)</h4>
                          <RewardImageUpload
                            currentImageUrl={formData.image_url}
                            onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                            onImageRemoved={() => setFormData({ ...formData, image_url: '' })}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Add an appetizing image to make rewards more appealing in the mobile app
                          </p>
                        </div>

                        {/* Settings */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-4">Settings</h4>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <label htmlFor="active" className="text-sm font-medium text-gray-900">
                                  Active Status
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formData.active 
                                    ? 'Customers can see and redeem this reward' 
                                    : 'Hidden from customers (can reactivate anytime)'}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    formData.active ? 'bg-green-500' : 'bg-gray-300'
                                  }`}
                                >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    formData.active ? 'translate-x-6' : 'translate-x-1'
                                  }`} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <label className="text-sm font-medium text-gray-900">
                                  Show Preview
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  See how this reward will look in the mobile app
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className="px-4 py-2 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors text-sm"
                              >
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setShowModal(false);
                              resetForm();
                            }}
                            className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                {editingReward ? 'Update Reward' : 'Create Reward'}
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Preview Column */}
                    {showPreview && (
                      <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-gray-50 rounded-lg p-4 border-2 border-[#810000]/20">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Mobile App Preview
                          </h4>
                          
                          {/* Mobile preview mockup */}
                          <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-200">
                            <div className="text-xs text-gray-500 mb-3 text-center">How it appears in app</div>
                            
                            {formData.image_url && (
                              <img 
                                src={formData.image_url} 
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg mb-3"
                              />
                            )}
                            
                            <div className="text-center">
                              <div className="text-2xl font-bold text-[#810000] mb-1">
                                {getCurrentDisplayValue() || (formData.reward_type === 'free_item' ? 'Free Item' : '$0 Off')}
                              </div>
                              <div className="text-sm font-medium text-gray-900 mb-2">
                                {formData.name || 'Reward Name'}
                              </div>
                              <div className="text-xs text-gray-600 mb-3">
                                {formData.description || 'Reward description'}
                              </div>
                              
                              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mb-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{formData.points_cost || 0} points</span>
                              </div>

                              <button 
                                type="button"
                                className="w-full py-2 px-4 bg-[#810000] text-white text-sm font-semibold rounded-lg opacity-50 cursor-not-allowed"
                              >
                                Redeem
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-800">
                              <strong>Note:</strong> This is how customers will see this reward in the "Redeem Rewards" section of the mobile app.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

