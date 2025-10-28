'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TucciLogo from '@/components/TucciLogo';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { signIn, loading, clearSession } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSigningIn(true);

    try {
      console.log('[LOGIN] Attempting sign in...');
      const result = await signIn(email, password);
      console.log('[LOGIN] Sign in result:', result);
      
      if (result.success) {
        console.log('[LOGIN] Sign in successful, redirecting to dashboard...');
        // Use window.location.href for a hard navigation to ensure cookies are set
        // This bypasses any client-side routing issues and lets middleware handle the redirect
        await new Promise(resolve => setTimeout(resolve, 200));
        window.location.href = '/dashboard';
        console.log('[LOGIN] Window location redirect called');
      } else {
        console.log('[LOGIN] Sign in failed:', result.error);
        setError(result.error || 'Login failed');
        setIsSigningIn(false);
      }
    } catch (error) {
      console.error('[LOGIN] Sign in error:', error);
      setError('An unexpected error occurred');
      setIsSigningIn(false);
    }
  };

  const handleClearSession = async () => {
    try {
      await clearSession();
      setError('');
      // Reload the page to clear any cached state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <TucciLogo size="3xl" showText={false} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tucci-serif">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Admin access only
            </p>
            <div className="w-12 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mx-auto mt-4 rounded-full"></div>
          </div>
        </div>
        
        
        <div className="tucci-card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent transition-all placeholder:text-gray-500 text-gray-900"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#810000] focus:border-transparent transition-all placeholder:text-gray-500 text-gray-900"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSigningIn || loading}
                className="tucci-button-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn || loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center space-y-2">
              <Link 
                href="/"
                className="text-sm text-[#810000] hover:text-[#6b0000] transition-colors block"
              >
                ← Back to home
              </Link>
              <button
                type="button"
                onClick={handleClearSession}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline"
              >
                Clear Session (if having login issues)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


