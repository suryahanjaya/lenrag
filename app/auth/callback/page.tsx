'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Get the authorization code from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      router.push('/?error=' + encodeURIComponent(error))
      return
    }

    if (code) {
      // Send the code to backend for token exchange
      handleAuthCallback(code)
    } else {
      console.error('No authorization code found')
      router.push('/?error=no_code')
    }
  }, [router])

  const handleAuthCallback = async (code: string) => {
    try {
      console.log('Exchanging authorization code for tokens...')

      const response = await fetch('http://localhost:8000/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Authentication failed')
      }

      const data = await response.json()
      console.log('Authentication successful:', data)

      // Store user data and tokens
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }

      // Store Google token for API calls
      localStorage.setItem('google_token', data.access_token)

      // Use window.location.replace for immediate navigation without adding to history
      window.location.replace('/?auth=success')
    } catch (error) {
      console.error('Authentication error:', error)
      window.location.replace('/?error=' + encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-lg">Completing authentication...</p>
      </div>
    </div>
  )
}