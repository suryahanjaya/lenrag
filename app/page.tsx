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
  const [showThemeToggle, setShowThemeToggle] = useState(false)

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

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.8) {
        setShowThemeToggle(true)
      } else {
        setShowThemeToggle(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    TokenManager.initialize();

    const checkAuth = () => {
      const storedUser = localStorage.getItem('user')
      const storedToken = TokenManager.getAccessToken()

      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          setToken(storedToken)
        } catch (error) {
          console.error('Error parsing stored user:', error)
          TokenManager.clearTokens()
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
    setUser(null)
    setToken(null)
    TokenManager.clearTokens()
    localStorage.removeItem('user')
    localStorage.removeItem('bulk_upload_state')
    sessionStorage.clear()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800 dark:from-[#050505] dark:to-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white dark:border-cyan-400"></div>
          <div className="absolute inset-0 rounded-full bg-white/20 dark:bg-cyan-500/20 blur-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-900 dark:from-[#050505] dark:via-[#0a0a0a] dark:to-black overflow-x-hidden">

      {/* Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-3 rounded-xl bg-red-600 dark:bg-white/5 backdrop-blur-xl border border-red-700 dark:border-white/10 hover:border-red-800 dark:hover:border-cyan-400/50 transition-all duration-300 shadow-lg hover:scale-110 ${showThemeToggle ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
      >
        {isDarkMode ? (
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">

        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          {/* Gradient Overlays - More Visible */}
          <div className="absolute inset-0 dark:opacity-0 opacity-100 transition-opacity duration-500">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-white/15 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-white/12 rounded-full blur-3xl"></div>
          </div>

          <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-cyan-500/18 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl"></div>
          </div>

          {/* More Visible Pipe Shapes */}
          <svg className="absolute top-10 right-10 w-[500px] h-[500px] opacity-60 dark:opacity-50" viewBox="0 0 200 200">
            <path d="M 30 100 Q 100 30, 170 100" stroke="white" className="dark:hidden" strokeWidth="30" fill="none" opacity="0.6" />
            <path d="M 30 100 Q 100 30, 170 100" stroke="#06b6d4" className="hidden dark:inline" strokeWidth="30" fill="none" opacity="0.5" />
          </svg>

          <svg className="absolute bottom-20 left-20 w-[550px] h-[550px] opacity-50 dark:opacity-45" viewBox="0 0 200 200">
            <path d="M 30 150 Q 100 30, 170 150" stroke="white" className="dark:hidden" strokeWidth="35" fill="none" opacity="0.5" />
            <path d="M 30 150 Q 100 30, 170 150" stroke="#3b82f6" className="hidden dark:inline" strokeWidth="35" fill="none" opacity="0.45" />
          </svg>

          <svg className="absolute top-1/3 left-1/2 w-[400px] h-[400px] opacity-40 dark:opacity-40" viewBox="0 0 200 200">
            <path d="M 50 80 Q 100 20, 150 80 T 150 140" stroke="white" className="dark:hidden" strokeWidth="25" fill="none" opacity="0.4" />
            <path d="M 50 80 Q 100 20, 150 80 T 150 140" stroke="#0ea5e9" className="hidden dark:inline" strokeWidth="25" fill="none" opacity="0.4" />
          </svg>

          {/* Additional Circles */}
          <div className="absolute top-20 left-1/4 w-32 h-32 border-2 border-white/30 dark:border-cyan-400/30 rounded-full"></div>
          <div className="absolute bottom-32 right-1/4 w-24 h-24 border border-white/20 dark:border-blue-400/20 rounded-full"></div>
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/10 dark:bg-cyan-400/10 rounded-full backdrop-blur-sm"></div>

          {/* Squares */}
          <div className="absolute top-40 right-1/3 w-20 h-20 border border-white/25 dark:border-blue-400/25 rounded-lg rotate-12"></div>
          <div className="absolute bottom-40 left-1/3 w-28 h-28 bg-white/5 dark:bg-cyan-400/5 rounded-xl backdrop-blur-sm"></div>

          {/* Floating Transparent DORA Logos - Small & Spread on Mobile */}
          <div className="absolute top-12 lg:top-16 left-8 lg:left-16 w-12 lg:w-20 md:w-24 h-12 lg:h-20 md:h-24 opacity-[0.08] dark:opacity-[0.12] animate-float" style={{ animationDuration: '8s' }}>
            <img src="/2T.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="absolute top-[20%] lg:top-1/4 md:bottom-20 right-10 lg:right-20 md:right-16 w-14 lg:w-22 md:w-28 h-14 lg:h-22 md:h-28 opacity-[0.07] dark:opacity-[0.10] animate-float" style={{ animationDuration: '10s', animationDelay: '1s' }}>
            <img src="/2T.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="absolute top-[50%] lg:top-1/3 md:top-1/4 right-[20%] lg:right-1/4 md:right-1/3 w-16 lg:w-26 md:w-32 h-16 lg:h-26 md:h-32 opacity-[0.06] dark:opacity-[0.10] animate-float" style={{ animationDuration: '12s', animationDelay: '2s' }}>
            <img src="/2T.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="absolute top-[70%] lg:top-1/2 md:bottom-1/4 left-[8%] lg:left-1/4 md:left-1/3 w-12 lg:w-18 md:w-20 h-12 lg:h-18 md:h-20 opacity-[0.09] dark:opacity-[0.12] animate-float" style={{ animationDuration: '9s', animationDelay: '3s' }}>
            <img src="/2T.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="absolute bottom-[12%] lg:bottom-1/4 md:top-3/4 right-[30%] lg:right-1/3 md:right-1/4 w-14 lg:w-22 md:w-26 h-14 lg:h-22 md:h-26 opacity-[0.08] dark:opacity-[0.11] animate-float" style={{ animationDuration: '11s', animationDelay: '4s' }}>
            <img src="/2T.png" alt="" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Main Content - Centered with More Gap */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-20 md:px-24 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 md:gap-20">

          {/* Logo - Spacing on all sides */}
          <div className="flex-shrink-0 order-1 mb-8 lg:mb-0 lg:mr-8 md:mr-12">
            <div
              className="relative group cursor-pointer"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ willChange: 'transform' }}
            >
              <div className="relative w-[280px] lg:w-[420px] md:w-[520px] h-[280px] lg:h-[420px] md:h-[520px] bg-white/[0.08] dark:bg-white/[0.02] backdrop-blur-xl rounded-full border border-white/20 dark:border-white/10 shadow-2xl flex items-center justify-center group-hover:border-white/40 dark:group-hover:border-cyan-400/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-cyan-500/5 to-transparent rounded-full pointer-events-none"></div>

                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 dark:bg-cyan-400/20 blur-2xl rounded-full group-hover:bg-white/30 dark:group-hover:bg-cyan-400/30 transition-all duration-300"></div>

                  <img
                    src="/2T.png"
                    alt="DORA"
                    className="w-[200px] lg:w-[300px] md:w-[360px] h-[200px] lg:h-[300px] md:h-[360px] object-contain relative z-10 drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 ease-out"
                    style={{ willChange: 'transform' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text & Button - 3 Breakpoints */}
          <div className="flex-1 text-center lg:text-left order-2">
            {/* Welcome to - Same font as subtitle */}
            <p className="text-sm lg:text-base md:text-lg text-white/70 dark:text-[#ABABAB] font-normal mb-0 animate-fade-in" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 400 }}>
              Welcome to
            </p>

            {/* DORA - Main heading */}
            <h1 className="text-5xl lg:text-7xl md:text-8xl font-bold tracking-tight mb-4 lg:mb-6 md:mb-8 animate-fade-in" style={{ fontFamily: '"Outfit", system-ui, sans-serif', letterSpacing: '-0.03em', fontWeight: 700, animationDelay: '0.1s' }}>
              <span className="text-white drop-shadow-2xl">DORA</span>
            </h1>

            {/* Subtitle - More spacing */}
            <p className="text-base lg:text-xl md:text-2xl text-white/90 dark:text-[#ABABAB] font-normal leading-relaxed mb-6 lg:mb-8 md:mb-10 animate-fade-in" style={{ animationDelay: '0.2s', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Your Intelligent Document Assistant
            </p>

            {/* Sign In Button */}
            <div className="animate-fade-in flex justify-center lg:justify-start" style={{ animationDelay: '0.3s' }}>
              <GoogleAuthButton onSuccess={handleAuthSuccess} />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="animate-bounce">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 dark:bg-cyan-400/20 blur-lg rounded-full"></div>
              <div className="relative bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-full p-3 border border-white/20 dark:border-white/10">
                <svg className="w-5 h-5 text-white dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
            Core Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
                title: 'Secure Authentication',
                desc: 'Enterprise-grade security with Google OAuth 2.0 encryption'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
                title: 'Universal Document Support',
                desc: 'Seamlessly integrate with Google Drive and process any document type'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
                title: 'Advanced AI Intelligence',
                desc: 'Get instant answers and insights from your document library'
              }
            ].map((feature, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-red-500/5 dark:bg-cyan-500/5 rounded-2xl blur-xl group-hover:bg-red-500/10 dark:group-hover:bg-cyan-500/10 transition-all duration-500"></div>
                <div className="relative bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-white/10 group-hover:border-red-400 dark:group-hover:border-cyan-400/30 transition-all duration-300 shadow-lg">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 dark:from-cyan-400/20 dark:to-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{feature.title}</h3>
                  <p className="text-gray-600 dark:text-[#ABABAB] leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-white to-gray-100 dark:from-[#0a0a0a] dark:to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
              Built with Modern Technology
            </h2>
            <p className="text-lg text-gray-600 dark:text-[#ABABAB]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Leveraging cutting-edge tools for maximum performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Next.js 14',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                desc: 'React Framework'
              },
              {
                name: 'FastAPI',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
                desc: 'High Performance'
              },
              {
                name: 'ChromaDB',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />,
                desc: 'Vector Database'
              },
              {
                name: 'Groq',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
                desc: 'AI Models'
              },
            ].map((tech, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-red-500/5 dark:bg-cyan-500/5 rounded-xl blur-lg group-hover:bg-red-500/10 dark:group-hover:bg-cyan-500/10 transition-all duration-500"></div>
                <div className="relative bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-white/10 group-hover:border-red-400 dark:group-hover:border-cyan-400/30 transition-all duration-300 text-center shadow-lg">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 dark:from-cyan-400/20 dark:to-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tech.icon}
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{tech.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-[#ABABAB]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-black dark:to-[#050505]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 dark:bg-cyan-500/10 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-3xl p-12 border border-gray-200 dark:border-white/10 shadow-2xl">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-lg text-gray-600 dark:text-[#ABABAB] mb-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Join thousands experiencing the future of document management
              </p>
              <GoogleAuthButton onSuccess={handleAuthSuccess} variant="cta" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-gray-500 dark:text-[#6B6B6B]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            © 2025 DORA - Your Intelligent Document Assistant
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  )
}