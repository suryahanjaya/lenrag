'use client'

import { useState, useEffect } from 'react'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { Dashboard } from '@/components/dashboard/dashboard'
import { User } from '@/lib/types'
import { TokenManager } from '@/utils/tokenManager'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const darkMode = savedTheme === 'dark' || document.documentElement.classList.contains('dark')
    setIsDarkMode(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Toggle theme function
  const toggleTheme = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  useEffect(() => {
    // Initialize TokenManager on app start
    TokenManager.initialize();

    const checkAuth = () => {
      const storedUser = localStorage.getItem('user')
      const storedToken = TokenManager.getAccessToken() // Use TokenManager

      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          setToken(storedToken)
        } catch (error) {
          console.error('Error parsing stored user:', error)
          TokenManager.clearTokens() // Use TokenManager to clear
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get('auth')

    if (authSuccess === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname)
      checkAuth()
    } else {
      checkAuth()
    }
  }, [])

  const handleAuthSuccess = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    // Clear all state
    setUser(null)
    setToken(null)

    // Clear all tokens using TokenManager
    TokenManager.clearTokens()

    // Clear user data
    localStorage.removeItem('user')

    // CLEAR upload state completely (no resume feature)
    localStorage.removeItem('bulk_upload_state')

    // Clear any remaining storage
    sessionStorage.clear()

    // Force reload to clear any cached state
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 dark:border-red-500"></div>
      </div>
    )
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  // Premium Split-Screen Login Page - Compact & Red Theme
  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Left Side - White Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl relative">
        {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-red-100 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-red-100 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Logo with animation - Smaller */}
          <div className="flex items-center mb-8 animate-fade-in-down">
            <div
              className="relative cursor-pointer group"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className="absolute inset-0 bg-red-500/20 blur-lg rounded-full animate-pulse"></div>
              <img src="/2.png" alt="DORA Logo" className="h-9 w-9 mr-2.5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-red-700 to-gray-900 dark:from-gray-100 dark:via-red-400 dark:to-gray-100 bg-clip-text text-transparent">DORA</span>
          </div>

          {/* Welcome Text - Smaller */}
          <div className="mb-7 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="mb-2">
              <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">Welcome to</p>
              <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-red-400 dark:via-red-300 dark:to-orange-400 bg-clip-text text-transparent animate-gradient-x">
                DORA
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your intelligent document assistant</p>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-7 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <GoogleAuthButton onSuccess={handleAuthSuccess} />
          </div>

          {/* Feature Cards - Compact & All Red */}
          <div className="space-y-3 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {/* Secure Authentication */}
            <div className="group bg-gradient-to-br from-red-50 via-white to-red-50/50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700/50 rounded-xl p-3.5 border border-red-100 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Secure Authentication</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Sign in securely with your Google account using OAuth 2.0 encryption</p>
                </div>
              </div>
            </div>

            {/* Document Integration - Red theme */}
            <div className="group bg-gradient-to-br from-red-50 via-white to-red-50/50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700/50 rounded-xl p-3.5 border border-red-100 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Document Integration</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Access and analyze all your Google Drive documents seamlessly</p>
                </div>
              </div>
            </div>

            {/* AI Intelligence - Red theme */}
            <div className="group bg-gradient-to-br from-red-50 via-white to-red-50/50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700/50 rounded-xl p-3.5 border border-red-100 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">AI Intelligence</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Universal document understanding powered by advanced AI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description Text - Smaller */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 italic animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Your intelligent companion for document understanding and knowledge management
          </p>
        </div>
      </div>


      {/* Right Side - Enhanced Premium Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-gray-800 dark:via-gray-900 dark:to-black items-center justify-center p-12 relative overflow-hidden">
        {/* Animated Gradient Orbs - More dynamic */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-white/30 dark:from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-gradient-to-tr from-red-900/50 dark:from-gray-700/50 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-white/15 dark:bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>

        {/* Geometric Shapes - More variety */}
        <div className="absolute top-20 left-20 w-40 h-40 border-4 border-white/25 rounded-3xl rotate-12 animate-float"></div>
        <div className="absolute bottom-32 right-24 w-32 h-32 border-4 border-white/20 rounded-2xl -rotate-12 animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 right-16 w-20 h-20 bg-white/15 rounded-xl rotate-45 animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-40 right-40 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

        {/* Main Logo Display - Enhanced */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Outer Glow Ring - Stronger */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[600px] h-[600px] bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
          </div>

          {/* Logo Container - Enhanced Glass Effect */}
          <div className="relative">
            {/* Rotating Border Effect - Faster */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-white/40 rounded-full blur-2xl animate-spin" style={{ animationDuration: '6s' }}></div>

            {/* Main Logo Circle - Larger and more prominent */}
            <div
              onClick={toggleTheme}
              className="relative w-[450px] h-[450px] bg-gradient-to-br from-white/30 to-white/10 rounded-full backdrop-blur-3xl border-2 border-white/40 shadow-2xl flex items-center justify-center group hover:scale-110 transition-all duration-700 hover:border-white/60 cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {/* Inner Glow - Stronger */}
              <div className="absolute inset-10 bg-gradient-to-br from-white/25 to-transparent rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>

              {/* Logo */}
              <div className="relative z-10">
                <img
                  src="/2T.png"
                  alt="DORA"
                  className="w-80 h-80 object-contain drop-shadow-2xl animate-float filter brightness-110 group-hover:brightness-125 transition-all duration-700"
                />
              </div>

              {/* Shine Effect on Hover - Enhanced */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full"></div>

              {/* Pulse ring on hover */}
              <div className="absolute inset-0 border-4 border-white/0 group-hover:border-white/30 rounded-full transition-all duration-700 group-hover:scale-110"></div>
            </div>

            {/* Floating Particles - More dynamic */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-white/35 to-white/15 rounded-3xl backdrop-blur-lg animate-float shadow-2xl"></div>
            <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-gradient-to-br from-white/30 to-white/10 rounded-3xl backdrop-blur-lg animate-float shadow-2xl" style={{ animationDelay: '0.7s' }}></div>
            <div className="absolute top-1/4 -right-20 w-20 h-20 bg-white/25 rounded-2xl backdrop-blur-lg animate-float shadow-xl" style={{ animationDelay: '1.2s' }}></div>
            <div className="absolute bottom-1/3 -left-16 w-16 h-16 bg-white/20 rounded-xl backdrop-blur-lg animate-float shadow-xl" style={{ animationDelay: '1.8s' }}></div>
          </div>
        </div>

        {/* Bottom Gradient Overlay - Enhanced */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-red-900/70 via-red-800/30 dark:from-gray-900/70 dark:via-gray-800/30 to-transparent"></div>

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        {/* Animated lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}