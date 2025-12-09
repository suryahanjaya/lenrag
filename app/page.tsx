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
            <p className="text-gray-500">Please sign in to continue</p>
          </div>


          {/* Google Sign In Button */}
          <div className="mb-8">
            <GoogleAuthButton onSuccess={handleAuthSuccess} />
          </div>

          {/* Description Text */}
          <p className="text-center text-sm text-gray-500">
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
                  src="/Logo2.png"
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