'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearSession: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second fallback timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('Session found for user:', session.user.email);
          setUser(session.user);
          // Fetch user role and set loading to false when done
          try {
            await fetchUserRole(session.user.id);
            if (isMounted) {
              setLoading(false);
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            if (isMounted) {
              setLoading(false);
            }
          }
        } else {
          console.log('No session found');
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (isMounted) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        } else if (session?.user) {
          setUser(session.user);
          // Fetch user role for any auth change with a user
          try {
            await fetchUserRole(session.user.id);
            if (isMounted) {
              setLoading(false);
            }
          } catch (error) {
            console.error('Error fetching user role on auth change:', error);
            if (isMounted) {
              setLoading(false);
            }
          }
        } else {
          // No user in session
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching user role for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        // If profiles table doesn't exist or user doesn't have a profile, set role to null
        setUserRole(null);
        return;
      }

      console.log('User role fetched:', data?.role);
      setUserRole(data?.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        // Provide more user-friendly error messages
        let errorMessage = 'Login failed';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else {
          errorMessage = error.message;
        }
        
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        setUser(data.user);
        // Let the auth state change handler fetch the role
        router.replace('/dashboard');
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Login failed' };
    } catch (error) {
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setLoading(false);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if signOut fails, clear local state and redirect
      setUser(null);
      setUserRole(null);
      setLoading(false);
      router.push('/login');
    }
  };

  const clearSession = async () => {
    try {
      // Clear any corrupted session data
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setLoading(false);
      // Clear any stored session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
      }
    } catch (error) {
      console.error('Error clearing session:', error);
      setUser(null);
      setUserRole(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signOut,
    clearSession,
    isAdmin: userRole === 'admin' || userRole === 'system_admin',
    isSuperAdmin: userRole === 'system_admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
