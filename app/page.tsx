'use client'

import { useState, useEffect } from 'react'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { Dashboard } from '@/components/dashboard/dashboard'
import { User } from '@/lib/types'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('access_token')

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('user')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('google_token')
        }
      }
      if (storedToken) {
        setToken(storedToken)
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
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
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
            <img src="/Logo.png" alt="DORA Logo" className="h-10 w-10 mr-3" />
            <span className="text-2xl font-bold text-gray-900">DORA</span>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
            <p className="text-gray-500">Welcome Back, Please enter Your details</p>
          </div>

          {/* Sign In / Sign Up Tabs */}
          <div className="flex gap-4 mb-8">
            <button className="flex-1 py-3 text-center font-semibold text-gray-900 border-b-2 border-gray-900">
              Sign In
            </button>
            <button className="flex-1 py-3 text-center font-semibold text-gray-400 border-b-2 border-transparent">
              Signup
            </button>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <GoogleAuthButton onSuccess={handleAuthSuccess} />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or Continue With</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:border-red-600 hover:bg-red-50 transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </button>
            <button className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-all">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            </button>
            <button className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-all">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
          </div>

          {/* Footer Text */}
          <p className="text-center text-sm text-gray-500">
            Join the millions of smart investors who trust us to manage their finances. Log in to access your personalized dashboard, track your portfolio performance, and make informed investment decisions.
          </p>
        </div>
      </div>

      {/* Right Side - Blue Gradient Visual Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated Background Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"></div>

        {/* 3D Safe/Vault Visual */}
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative">
            {/* Main Safe Box */}
            <div className="w-80 h-80 bg-gradient-to-br from-blue-300 to-blue-400 rounded-3xl shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-500">
              {/* Safe Door */}
              <div className="absolute inset-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl shadow-inner flex items-center justify-center">
                {/* Lock Dial */}
                <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    {/* Lock Icon */}
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                {/* Handle */}
                <div className="absolute right-4 w-3 h-16 bg-blue-200 rounded-full shadow-md"></div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-8 -right-8 w-16 h-16 bg-white/30 rounded-lg backdrop-blur-sm animate-float"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-red-400/30 rounded-lg backdrop-blur-sm animate-float" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Decorative Text */}
        <div className="absolute bottom-12 left-12 right-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Secure Document Storage</h2>
          <p className="text-blue-100 text-lg">Your documents are safe with enterprise-grade encryption</p>
        </div>
      </div>
    </div>
  )
}