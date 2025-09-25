'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when loading is complete
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
      } else if (!isAdmin) {
        console.log('User is not admin, redirecting to login');
        router.push('/login');
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#810000] mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Tucci's Admin</h2>
          <p className="text-gray-600 mb-4">Please wait while we verify your access...</p>
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="bg-[#810000] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
