'use client';

import Link from 'next/link';
import TucciLogo from '@/components/TucciLogo';
import { LogoutIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardNavbarProps {
  currentPage?: string;
  showUserInfo?: boolean;
}

export default function DashboardNavbar({ currentPage, showUserInfo = false }: DashboardNavbarProps) {
  const { user, signOut } = useAuth();
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/events', label: 'Events', key: 'events' },
    { href: '/analytics', label: 'Analytics', key: 'analytics' },
    { href: '/notifications', label: 'Notifications', key: 'notifications' },
    { href: '/users', label: 'Users', key: 'users' },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="cursor-pointer">
              <TucciLogo className="h-16 w-16" showText={false} />
            </Link>
          </div>
          
          {/* Navigation Items - positioned closer to logo */}
          <div className="flex items-center space-x-3 ml-6">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`px-3 py-2 transition-colors cursor-pointer ${
                  currentPage === item.key
                    ? 'text-red-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Spacer to push user info and logout to the right */}
          <div className="flex-1"></div>
          
          {/* User Info and Logout - positioned at far right */}
          <div className="flex items-center space-x-4">
            {showUserInfo && user && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Logged in as</div>
                <div className="text-sm font-medium text-gray-900">{user.email}</div>
              </div>
            )}
            
            <button
              onClick={signOut}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <LogoutIcon className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
