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
          
          // Fetch user role
          try {
            const roleResponse = await fetch('/api/auth/user-role', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              setUserRole(roleData.role);
              console.log('✅ [AUTH] Role fetched:', roleData.role);
            } else {
              console.warn('⚠️ [AUTH] Role fetch failed, using default');
              setUserRole('user');
            }
          } catch (roleError) {
            console.warn('⚠️ [AUTH] Role fetch error, using default:', roleError);
            setUserRole('user');
          }
        } else {
          console.log('ℹ️ [AUTH] No session found');
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔄 [AUTH] Auth change:', event, session?.user?.email);
      
      // Keep loading true while we fetch the role
      setLoading(true);
      
      if (session?.user) {
        setUser(session.user);
        
        // Fetch role for new session
        try {
          const roleResponse = await fetch('/api/auth/user-role', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            setUserRole(roleData.role);
            console.log('✅ [AUTH] Role fetched on auth change:', roleData.role);
          } else {
            setUserRole('user');
          }
        } catch (error) {
          console.warn('⚠️ [AUTH] Role fetch error on auth change:', error);
          setUserRole('user');
        }
        
        // Set loading false after role is fetched
        setLoading(false);
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Signing in:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH] Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ [AUTH] Sign in successful');
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      console.error('❌ [AUTH] Sign in exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 [AUTH] Signing out');
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      router.push('/login');
    } catch (error) {
      console.error('❌ [AUTH] Sign out error:', error);
    }
  };

  const clearSession = async () => {
    try {
      console.log('🧹 [AUTH] Clearing session');
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('❌ [AUTH] Clear session error:', error);
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'system_admin';
  const isSuperAdmin = userRole === 'system_admin';

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signOut,
    clearSession,
    isAdmin,
    isSuperAdmin,
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