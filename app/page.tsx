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

    // Clear any remaining storage
    sessionStorage.clear()

    // Force reload to clear any cached state
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  // Premium Split-Screen Login Page
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - White Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center mb-12">
            <img src="/2.png" alt="DORA Logo" className="h-10 w-10 mr-3" />
            <span className="text-2xl font-bold text-gray-900">DORA</span>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
            <p className="text-gray-500">Please sign in to continue</p>
          </div>


          {/* Google Sign In Button */}
          <div className="mb-8">
            <GoogleAuthButton onSuccess={handleAuthSuccess} />
          </div>

          {/* Feature Cards - Premium */}
          <div className="space-y-3 mb-8">
            {/* Secure Authentication */}
            <div className="group bg-gradient-to-br from-red-50/80 to-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-100/50 hover:border-red-200 transition-all duration-300 hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Secure Authentication</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Sign in securely with your Google account using OAuth 2.0</p>
                </div>
              </div>
            </div>

            {/* Document Integration */}
            <div className="group bg-gradient-to-br from-white/80 to-red-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50 hover:border-red-200 transition-all duration-300 hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Document Integration</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Access and select from all your Google Docs seamlessly</p>
                </div>
              </div>
            </div>

            {/* DORA Intelligence */}
            <div className="group bg-gradient-to-br from-red-50/80 to-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-100/50 hover:border-red-200 transition-all duration-300 hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">DORA Intelligence</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Universal document understanding for all types of content</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description Text */}
          <p className="text-center text-xs text-gray-400 italic">
            Your intelligent companion for document understanding and knowledge management
          </p>
        </div>
      </div>


      {/* Right Side - Gen Z Premium Visual with Logo2 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-500 via-red-600 to-red-700 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-red-900/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Geometric Shapes - Gen Z Style */}
        <div className="absolute top-20 left-20 w-32 h-32 border-4 border-white/20 rounded-3xl rotate-12 animate-float"></div>
        <div className="absolute bottom-32 right-24 w-24 h-24 border-4 border-white/15 rounded-2xl -rotate-12 animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 right-16 w-16 h-16 bg-white/10 rounded-xl rotate-45 animate-float" style={{ animationDelay: '1.5s' }}></div>

        {/* Main Logo Display - Minimal & Clean */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[500px] h-[500px] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl"></div>
          </div>

          {/* Logo Container - Premium Glass Effect */}
          <div className="relative">
            {/* Rotating Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-white/30 rounded-full blur-xl animate-spin" style={{ animationDuration: '8s' }}></div>

            {/* Main Logo Circle */}
            <div className="relative w-96 h-96 bg-gradient-to-br from-white/25 to-white/5 rounded-full backdrop-blur-2xl border-2 border-white/30 shadow-2xl flex items-center justify-center group hover:scale-105 transition-all duration-500">
              {/* Inner Glow */}
              <div className="absolute inset-8 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>

              {/* Logo */}
              <div className="relative z-10">
                <img
                  src="/2T.png"
                  alt="DORA"
                  className="w-72 h-72 object-contain drop-shadow-2xl animate-float filter brightness-110"
                />
              </div>

              {/* Shine Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
            </div>

            {/* Floating Particles */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl backdrop-blur-md animate-float shadow-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-br from-white/25 to-white/5 rounded-2xl backdrop-blur-md animate-float shadow-xl" style={{ animationDelay: '0.7s' }}></div>
            <div className="absolute top-1/4 -right-16 w-16 h-16 bg-white/20 rounded-xl backdrop-blur-md animate-float shadow-lg" style={{ animationDelay: '1.2s' }}></div>
            <div className="absolute bottom-1/3 -left-12 w-12 h-12 bg-white/15 rounded-lg backdrop-blur-md animate-float shadow-lg" style={{ animationDelay: '1.8s' }}></div>
          </div>
        </div>

        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-red-900/60 via-red-800/20 to-transparent"></div>

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>
    </div>
  )
}