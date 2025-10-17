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

    // Simple fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('🚨 [AUTH] Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000); // 3 second timeout

    // Simplified auth initialization
    const initializeAuth = async () => {
      try {
        console.log('🔍 [AUTH] Initializing auth...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('❌ [AUTH] Session error:', error);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ [AUTH] Found session for:', session.user.email);
          setUser(session.user);
          
          // Fetch role with retry mechanism
          let roleFetched = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`🔍 [AUTH] Role fetch attempt ${attempt}/3`);
              const roleResponse = await Promise.race([
                fetch('/api/auth/user-role'),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Role fetch timeout')), 2000)
                )
              ]) as Response;
              
              if (roleResponse.ok) {
                const roleData = await roleResponse.json();
                console.log('✅ [AUTH] Role fetched:', roleData.role);
                setUserRole(roleData.role);
                roleFetched = true;
                break;
              } else {
                console.warn(`⚠️ [AUTH] Role fetch attempt ${attempt} failed:`, roleResponse.status);
              }
            } catch (error) {
              console.warn(`⚠️ [AUTH] Role fetch attempt ${attempt} error:`, error);
            }
            
            // Wait before retry (except on last attempt)
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          if (!roleFetched) {
            console.error('❌ [AUTH] All role fetch attempts failed');
            setUserRole(null);
          }
        } else {
          console.log('🔍 [AUTH] No session found');
          setUser(null);
          setUserRole(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ [AUTH] Initialization error:', error);
        if (isMounted) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AUTH] Auth change:', event, session?.user?.email);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        } else if (session?.user) {
          setUser(session.user);
          // Quick role fetch - but don't fail if it doesn't work
          try {
            const roleResponse = await fetch('/api/auth/user-role');
            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              setUserRole(roleData.role);
            } else {
              console.warn('⚠️ [AUTH] Role fetch failed on auth change, but keeping user logged in');
            }
          } catch (error) {
            console.warn('⚠️ [AUTH] Role fetch error on auth change, but keeping user logged in:', error);
          }
          setLoading(false);
        } else {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Initialize
    initializeAuth();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('🔍 [AUTH] Fetching user role for:', userId);
      
      // First, verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ [AUTH] No valid session for role fetch:', sessionError);
        setUserRole(null);
        return;
      }
      
      // Use the API endpoint to fetch role (bypasses RLS issues)
      const response = await fetch('/api/auth/user-role', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 [AUTH] Role API response status:', response.status);
      console.log('🔍 [AUTH] Role API response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AUTH] Failed to fetch user role:', response.status, response.statusText, errorText);
        setUserRole(null);
        return;
      }

      const data = await response.json();
      console.log('✅ [AUTH] User role fetched successfully:', data?.role);
      console.log('🔍 [AUTH] Full role API response:', data);
      setUserRole(data?.role || null);
    } catch (error) {
      console.error('❌ [AUTH] Error fetching user role:', error);
      setUserRole(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔍 [AUTH] Signing in:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH] Sign in error:', error);
        setLoading(false);
        
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
        console.log('✅ [AUTH] Sign in successful:', data.user.email);
        setUser(data.user);
        // The auth state change handler will fetch the role
        router.replace('/dashboard');
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('❌ [AUTH] Sign in error:', error);
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔍 [AUTH] Starting sign out');
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setLoading(false);
      router.push('/login');
    } catch (error) {
      console.error('❌ [AUTH] Error signing out:', error);
      // Even if signOut fails, clear local state and redirect
      setUser(null);
      setUserRole(null);
      setLoading(false);
      router.push('/login');
    }
  };

  const clearSession = async () => {
    try {
      console.log('🔍 [AUTH] Clearing session');
      // Clear any corrupted session data
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setLoading(false);
      // Clear any stored session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
        // Clear all Supabase related localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('❌ [AUTH] Error clearing session:', error);
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
