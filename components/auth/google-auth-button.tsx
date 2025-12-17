'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { User } from '@/lib/types'

interface GoogleAuthButtonProps {
  onSuccess: (user: User) => void
  variant?: 'hero' | 'cta'
}

export function GoogleAuthButton({ onSuccess, variant = 'hero' }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGoogleAuth = () => {
    setLoading(true)

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/callback`
    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly'
    ].join(' ')

    // OAuth Configuration

    if (!clientId) {
      alert('Google Client ID is not configured. Please check your .env.local file.')
      setLoading(false)
      return
    }

    const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`

    // OAuth URL generated

    // Open Google OAuth in the same window
    window.location.href = authUrl
  }

  // Determine button style based on variant
  const buttonClassName = variant === 'hero'
    ? "bg-transparent dark:bg-transparent hover:bg-white/[0.08] dark:hover:bg-white/[0.08] backdrop-blur-xl border border-white/20 dark:border-white/20 hover:border-white/40 dark:hover:border-cyan-400/50 text-white dark:text-[#F2F2F2] px-10 py-6 text-base font-medium shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-full relative overflow-hidden group"
    : "bg-red-600 dark:bg-transparent hover:bg-red-700 dark:hover:bg-white/[0.08] backdrop-blur-xl border border-red-700 dark:border-white/20 hover:border-red-800 dark:hover:border-cyan-400/50 text-white dark:text-[#F2F2F2] px-10 py-6 text-base font-medium shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-full relative overflow-hidden group"

  return (
    <Button
      onClick={handleGoogleAuth}
      disabled={loading}
      size="lg"
      className={buttonClassName}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-red-800/0 dark:bg-cyan-400/0 group-hover:bg-red-800/20 dark:group-hover:bg-cyan-400/10 transition-all duration-300 rounded-full blur-xl"></div>

      <div className="relative z-10 flex items-center justify-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-cyan-400 mr-3"></div>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              {/* Single Color Google Logo - White in Light Mode, Cyan in Dark Mode */}
              <path
                className="fill-white dark:fill-cyan-400"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                className="fill-white dark:fill-cyan-400"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                className="fill-white dark:fill-cyan-400"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                className="fill-white dark:fill-cyan-400"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </>
        )}
      </div>
    </Button>
  )
}