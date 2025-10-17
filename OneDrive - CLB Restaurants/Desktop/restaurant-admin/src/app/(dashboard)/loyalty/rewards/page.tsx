'use client';

import { useState, useEffect } from 'react';
import DashboardNavbar from '../../../../components/DashboardNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/contexts/ToastContext';

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
  created_at: string;
}

export default function LoyaltyRewardsPage() {
  const { showToast } = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_cost: '',
    value_cents: '',
    reward_type: 'dollar_off',
    active: true,
    image_url: ''
  });

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/loyalty/rewards');
      if (response.ok) {
        const data = await response.json();
        setRewards(data.sort((a, b) => a.points_cost - b.points_cost));
      } else {
        showToast('Failed to load rewards', 'error');
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      showToast('Error loading rewards', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      points_cost: '',
      value_cents: '',
      reward_type: 'dollar_off',
      active: true,
      image_url: ''
    });
    setImagePreview('');
    setSelectedFile(null);
    setEditingReward(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-reward-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (selectedFile) {
        setUploadingImage(true);
        imageUrl = await uploadImage(selectedFile);
        setUploadingImage(false);
      }

      const url = editingReward 
        ? `/api/loyalty/rewards/${editingReward.id}` 
        : '/api/loyalty/rewards';
      const method = editingReward ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          points_cost: parseInt(formData.points_cost),
          value_cents: parseInt(formData.value_cents),
          image_url: imageUrl,
          brand: 'tuccis'
        }),
      });

      if (response.ok) {
        showToast(
          editingReward ? 'Reward updated successfully' : 'Reward created successfully',
          'success'
        );
        await fetchRewards();
        setShowModal(false);
        resetForm();
      } else {
        showToast('Failed to save reward', 'error');
      }
    } catch (error) {
      console.error('Error saving reward:', error);
      showToast('Error saving reward', 'error');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      points_cost: reward.points_cost.toString(),
      value_cents: reward.value_cents.toString(),
      reward_type: reward.reward_type,
      active: reward.active,
      image_url: reward.image_url || ''
    });
    setImagePreview(reward.image_url || '');
    setShowModal(true);
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
          active: !reward.active
        }),
      });

      if (response.ok) {
        showToast(
          reward.active ? 'Reward deactivated' : 'Reward activated',
          'success'
        );
        await fetchRewards();
      } else {
        showToast('Failed to update reward', 'error');
      }
    } catch (error) {
      console.error('Error toggling reward status:', error);
      showToast('Error updating reward', 'error');
    }
  };

  const handleDelete = async (reward: Reward) => {
    if (!confirm(`Are you sure you want to delete "${reward.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/loyalty/rewards/${reward.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Reward deleted successfully', 'success');
        await fetchRewards();
      } else {
        showToast('Failed to delete reward', 'error');
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
      showToast('Error deleting reward', 'error');
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'dollar_off': return 'Dollar Off';
      case 'percent_off': return 'Percent Off';
      case 'free_item': return 'Free Item';
      default: return type;
    }
  };

  const getRewardValue = (reward: Reward) => {
    if (reward.reward_type === 'dollar_off') {
      return `$${(reward.value_cents / 100).toFixed(0)} Off`;
    } else if (reward.reward_type === 'percent_off') {
      return `${reward.value_cents}% Off`;
    } else {
      return 'Free Item';
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
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tucci-serif">Reward Catalog</h1>
                  <p className="mt-2 text-gray-600">Manage rewards that customers can redeem with their loyalty points</p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="px-6 py-3 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors font-medium"
                >
                  + Add Reward
                </button>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mt-4 rounded-full"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Rewards</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{rewards.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Rewards</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {rewards.filter(r => r.active).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inactive Rewards</p>
                    <p className="text-3xl font-bold text-gray-400 mt-1">
                      {rewards.filter(r => !r.active).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reward
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Cost
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#810000]"></div>
                          </div>
                        </td>
                      </tr>
                    ) : rewards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <p className="text-gray-500">No rewards found</p>
                          <p className="text-gray-400 text-sm mt-2">Click "Add Reward" to create your first reward</p>
                        </td>
                      </tr>
                    ) : (
                      rewards.map((reward) => (
                        <tr key={reward.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {reward.image_url && (
                                <img 
                                  src={reward.image_url} 
                                  alt={reward.name}
                                  className="h-12 w-12 rounded-lg object-cover mr-4"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">{reward.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{getRewardTypeLabel(reward.reward_type)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {reward.points_cost.toLocaleString()} pts
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {getRewardValue(reward)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              reward.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {reward.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(reward)}
                              className="text-[#810000] hover:text-[#6b0000] mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(reward)}
                              className={`mr-4 ${reward.active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                            >
                              {reward.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(reward)}
                              className="text-red-600 hover:text-red-700"
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
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 tucci-serif">
                  {editingReward ? 'Edit Reward' : 'Add New Reward'}
                </h3>
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

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reward Image
                    </label>
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setSelectedFile(null);
                            setFormData({ ...formData, image_url: '' });
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#810000] transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">Click to upload an image</p>
                          <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 10MB</p>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reward Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g., $10 Off Your Order"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={3}
                        placeholder="Describe the reward and any restrictions..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reward Type *
                      </label>
                      <select
                        value={formData.reward_type}
                        onChange={(e) => setFormData({ ...formData, reward_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                      >
                        <option value="dollar_off">Dollar Off</option>
                        <option value="percent_off">Percent Off</option>
                        <option value="free_item">Free Item</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points Cost *
                      </label>
                      <input
                        type="number"
                        value={formData.points_cost}
                        onChange={(e) => setFormData({ ...formData, points_cost: e.target.value })}
                        required
                        min="1"
                        placeholder="e.g., 250"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {formData.reward_type === 'dollar_off' ? 'Discount Amount (in cents)' : 
                         formData.reward_type === 'percent_off' ? 'Percentage Off' : 
                         'Value (in cents)'} *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.value_cents}
                          onChange={(e) => setFormData({ ...formData, value_cents: e.target.value })}
                          required
                          min="1"
                          placeholder={
                            formData.reward_type === 'dollar_off' ? 'e.g., 1000 for $10' :
                            formData.reward_type === 'percent_off' ? 'e.g., 10 for 10%' :
                            'e.g., 1500 for $15 item'
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent"
                        />
                        {formData.reward_type === 'dollar_off' && formData.value_cents && (
                          <span className="absolute right-3 top-2 text-sm text-gray-500">
                            = ${(parseInt(formData.value_cents) / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.reward_type === 'dollar_off' && 'Enter amount in cents (e.g., 1000 = $10.00)'}
                        {formData.reward_type === 'percent_off' && 'Enter percentage value (e.g., 10 = 10% off)'}
                        {formData.reward_type === 'free_item' && 'Enter the value of the free item in cents'}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="active"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          className="h-4 w-4 text-[#810000] focus:ring-[#810000] border-gray-300 rounded"
                        />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                          Active (visible to customers)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploadingImage}
                      className="px-6 py-2 bg-[#810000] text-white rounded-lg hover:bg-[#6b0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading Image...
                        </>
                      ) : saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        editingReward ? 'Update Reward' : 'Create Reward'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
