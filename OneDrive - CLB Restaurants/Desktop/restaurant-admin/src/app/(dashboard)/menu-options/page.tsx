'use client';

import { useState } from 'react';
import DashboardNavbar from '@/components/DashboardNavbar';
import { useMenuOptions } from '@/hooks/useMenuOptions';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface MenuOption {
  id: string;
  value: string;
  label: string;
  category: string;
  display_order: number;
  is_active: boolean;
}

export default function MenuOptionsPage() {
  const { showToast } = useToast();
  const { userRole, isAdmin, isSuperAdmin } = useAuth();
  const { menuOptions, loading, addMenuOption, updateMenuOption, deleteMenuOption } = useMenuOptions();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOption, setEditingOption] = useState<MenuOption | null>(null);
  const [newOption, setNewOption] = useState({
    label: '',
    value: '',
  });


  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOption.label.trim()) {
      showToast('Please enter a menu name', 'error');
      return;
    }

    try {
      // Create menu placeholder in database (same as mobile app)
      const { data, error } = await supabase
        .from('menu_options')
        .insert({
          label: newOption.label,
          category: 'Menu Pages', // Always set to Menu Pages
          value: newOption.value || newOption.label.toLowerCase().replace(/\s+/g, '-'),
          display_order: Object.values(menuOptions).flat().length + 1,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding menu:', error);
        showToast('Failed to add menu', 'error');
        return;
      }

      // Store the label for the toast message before resetting
      const addedLabel = newOption.label;
      
      // Reset form
      setNewOption({ label: '', value: '' });
      setShowCreateForm(false);
      
      // Reload the page to show the new menu
      window.location.reload();
      
      showToast(
        `"${addedLabel}" has been added as a placeholder. Send the menu link to the developer to create the custom page.`,
        'success'
      );
    } catch (error) {
      console.error('Error adding menu:', error);
      showToast('Failed to add menu', 'error');
    }
  };

  const handleUpdateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOption) return;
    
    try {
      // Only update the label field, not value or category
      await updateMenuOption(editingOption.id, { label: editingOption.label });
      setEditingOption(null);
      showToast('Menu option updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update menu option', 'error');
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (!isSuperAdmin) {
      showToast('Only System Admins can delete menu options', 'error');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this menu option?')) return;
    
    try {
      await deleteMenuOption(id);
      showToast('Menu option deleted successfully!', 'success');
    } catch (error) {
      showToast('Failed to delete menu option', 'error');
    }
  };

  const toggleActive = async (option: MenuOption) => {
    try {
      await updateMenuOption(option.id, { is_active: !option.is_active });
      showToast(`Menu option ${!option.is_active ? 'activated' : 'deactivated'} successfully!`, 'success');
    } catch (error) {
      showToast('Failed to update menu option', 'error');
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar currentPage="menu-options" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#810000] mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Menu Options</h2>
            <p className="text-gray-600">Fetching menu options...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar currentPage="menu-options" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
          <p className="text-gray-600">
            Manage menu options and add new menu placeholders for the mobile app.
          </p>
        </div>

        {/* Add New Menu Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="tucci-button-primary px-6 py-2"
          >
            Add New Menu
          </button>
        </div>

        {/* Add New Menu Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Menu</h3>
              <form onSubmit={handleCreateOption}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Menu Name *</label>
                  <input
                    type="text"
                    value={newOption.label}
                    onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900"
                    placeholder="e.g., Special Events Menu"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="tucci-button-primary px-4 py-2"
                  >
                    Add Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewOption({ label: '', value: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Form Modal */}
        {editingOption && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Menu Option</h3>
              <form onSubmit={handleUpdateOption}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Label</label>
                  <input
                    type="text"
                    value={editingOption.label}
                    onChange={(e) => setEditingOption({ ...editingOption, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#810000] text-gray-900"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="tucci-button-primary px-4 py-2"
                  >
                    Update Option
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOption(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu Options List */}
        <div className="space-y-6">
          {Object.entries(menuOptions).map(([category, options]) => (
            <div key={category} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                <p className="text-sm text-gray-500">{options.length} options</p>
              </div>
              <div className="divide-y divide-gray-200">
                {options.map((option) => {
                  return (
                    <div key={option.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{option.label}</p>
                            <p className="text-sm text-gray-500">{option.value}</p>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              option.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {option.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleActive(option)}
                          className={`px-3 py-1 text-xs rounded-md ${
                            option.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {option.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setEditingOption(option)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteOption(option.id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
