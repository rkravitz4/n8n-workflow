'use client';

import Link from "next/link";
import TucciLogo from "@/components/TucciLogo";
import { AnalyticsIcon, EventsIcon, NotificationsIcon, UsersIcon } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately if user is logged in and is admin
    if (!loading && user && isAdmin) {
      router.replace('/dashboard'); // Use replace instead of push to avoid back button issues
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#810000] mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Tucci's Admin</h2>
          <p className="text-gray-600 mb-4">Checking your authentication...</p>
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="bg-[#810000] h-2 rounded-full animate-pulse" style={{width: '40%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-end p-6 border-b border-gray-200 bg-white shadow-sm">
        <Link 
          href="/login"
          className="tucci-button-primary"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="min-h-screen flex flex-col items-center justify-start px-6 pt-2 pb-16 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-[#810000] rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-[#ab974f] rounded-full blur-2xl"></div>
          <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-[#810000] rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
          {/* Logo Section - As close to header as possible and 25% smaller */}
          <div className="mb-8 flex justify-center">
            <TucciLogo size="4xl" showText={false} />
          </div>
          
          {/* Title Section */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 tucci-serif leading-tight">
              <span className="text-[#810000]">Restaurant</span>
              <span className="block text-[#ab974f] mt-3">
                Admin
              </span>
            </h1>
            <div className="w-40 h-1.5 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mx-auto rounded-full shadow-lg"></div>
          </div>
          
          {/* Description */}
          <p className="text-2xl md:text-3xl text-gray-700 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
            Backend administration panel for the Tucci's mobile app. 
            Manage events, send notifications, track analytics, and oversee user accounts.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center">
            <Link 
              href="/login"
              className="tucci-button-primary text-xl px-12 py-5 min-w-[220px] shadow-xl hover:shadow-2xl"
            >
              Get Started
            </Link>
            <Link 
              href="/dashboard"
              className="tucci-button-secondary text-xl px-12 py-5 min-w-[220px] shadow-xl hover:shadow-2xl"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 tucci-serif text-[#810000]">
              Admin Dashboard
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#ab974f] to-[#c4a85a] mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="tucci-card p-10 text-center group hover:scale-105">
              <div className="flex justify-center mb-8">
                <div className="p-6 rounded-full bg-gradient-to-br from-[#810000]/10 to-[#ab974f]/10 group-hover:from-[#810000]/20 group-hover:to-[#ab974f]/20 transition-all duration-300">
                  <AnalyticsIcon size={40} className="text-[#810000] group-hover:text-[#ab974f] transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 tucci-serif text-[#810000]">Analytics</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Monitor app usage, user engagement, and performance metrics</p>
            </div>
            
            <div className="tucci-card p-10 text-center group hover:scale-105">
              <div className="flex justify-center mb-8">
                <div className="p-6 rounded-full bg-gradient-to-br from-[#810000]/10 to-[#ab974f]/10 group-hover:from-[#810000]/20 group-hover:to-[#ab974f]/20 transition-all duration-300">
                  <EventsIcon size={40} className="text-[#810000] group-hover:text-[#ab974f] transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 tucci-serif text-[#810000]">Events</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Create and manage events that appear in the mobile app</p>
            </div>
            
            <div className="tucci-card p-10 text-center group hover:scale-105">
              <div className="flex justify-center mb-8">
                <div className="p-6 rounded-full bg-gradient-to-br from-[#810000]/10 to-[#ab974f]/10 group-hover:from-[#810000]/20 group-hover:to-[#ab974f]/20 transition-all duration-300">
                  <NotificationsIcon size={40} className="text-[#810000] group-hover:text-[#ab974f] transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 tucci-serif text-[#810000]">Notifications</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Send push notifications to mobile app users</p>
            </div>
            
            <div className="tucci-card p-10 text-center group hover:scale-105">
              <div className="flex justify-center mb-8">
                <div className="p-6 rounded-full bg-gradient-to-br from-[#810000]/10 to-[#ab974f]/10 group-hover:from-[#810000]/20 group-hover:to-[#ab974f]/20 transition-all duration-300">
                  <UsersIcon size={40} className="text-[#810000] group-hover:text-[#ab974f] transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 tucci-serif text-[#810000]">Users</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Manage mobile app user accounts and permissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0">
              <TucciLogo size="2xl" showText={false} variant="dark" />
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-300 mb-2 text-lg">&copy; 2024 Tucci's Restaurant</p>
              <p className="text-gray-400">Professional Restaurant Admin System</p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-500">
              Built with Next.js, Tailwind CSS, and Supabase
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
