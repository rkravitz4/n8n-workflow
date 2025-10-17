import { useState, useEffect } from 'react';

interface MenuOption {
  id: string;
  value: string;
  label: string;
  category: string;
  display_order: number;
  is_active: boolean;
  is_visible: boolean;
  hidden_by_admin: boolean;
  hidden_by_system_admin: boolean;
}

interface MenuOptionsByCategory {
  [category: string]: MenuOption[];
}

export function useMenuOptions() {
  const [menuOptions, setMenuOptions] = useState<MenuOptionsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuOptions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/menu-options');
        
        if (!response.ok) {
          throw new Error('Failed to fetch menu options');
        }
        
        const data = await response.json();
        setMenuOptions(data.menuOptions || {});
        setError(null);
      } catch (err) {
        console.error('Error fetching menu options:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to empty object to prevent crashes
        setMenuOptions({});
      } finally {
        setLoading(false);
      }
    };

    fetchMenuOptions();
  }, []);

  const addMenuOption = async (option: Omit<MenuOption, 'id' | 'display_order'>) => {
    try {
      const response = await fetch('/api/menu-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(option),
      });

      if (!response.ok) {
        throw new Error('Failed to add menu option');
      }

      const data = await response.json();
      
      // Update local state
      setMenuOptions(prev => ({
        ...prev,
        [option.category]: [...(prev[option.category] || []), data.menuOption]
      }));

      return data.menuOption;
    } catch (err) {
      console.error('Error adding menu option:', err);
      throw err;
    }
  };

  const updateMenuOption = async (id: string, updates: Partial<MenuOption>) => {
    try {
      const response = await fetch(`/api/menu-options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update menu option');
      }

      const data = await response.json();
      
      // Update local state
      setMenuOptions(prev => {
        const newOptions = { ...prev };
        Object.keys(newOptions).forEach(category => {
          newOptions[category] = newOptions[category].map(option =>
            option.id === id ? { ...option, ...data.menuOption } : option
          );
        });
        return newOptions;
      });

      return data.menuOption;
    } catch (err) {
      console.error('Error updating menu option:', err);
      throw err;
    }
  };

  const deleteMenuOption = async (id: string) => {
    try {
      const response = await fetch(`/api/menu-options/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu option');
      }

      // Update local state
      setMenuOptions(prev => {
        const newOptions = { ...prev };
        Object.keys(newOptions).forEach(category => {
          newOptions[category] = newOptions[category].filter(option => option.id !== id);
        });
        return newOptions;
      });

      return true;
    } catch (err) {
      console.error('Error deleting menu option:', err);
      throw err;
    }
  };

  return {
    menuOptions,
    loading,
    error,
    addMenuOption,
    updateMenuOption,
    deleteMenuOption,
  };
}
