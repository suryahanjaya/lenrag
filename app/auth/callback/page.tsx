'use client'

import { useEffect } from 'react'

export default function AuthCallback() {
  useEffect(() => {
    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const error = params.get('error')

        if (error) {
          console.error('OAuth error:', error)
          window.location.href = '/?error=' + encodeURIComponent(error)
          return
        }

        if (!code) {
          console.error('No authorization code found')
          window.location.href = '/?error=no_code'
          return
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin
        // CRITICAL: redirect_uri MUST match the frontend callback URL registered in Google Console
        const frontendUrl = window.location.origin

        const response = await fetch(`${backendUrl}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirect_uri: `${frontendUrl}/auth/callback`
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Authentication failed')
        }

        const data = await response.json()

        if (typeof window !== 'undefined') {
          const { TokenManager } = await import('@/utils/tokenManager')

          // Save user data
          localStorage.setItem('user', JSON.stringify(data.user))

          // Use TokenManager to save tokens with consistent keys and expiry
          TokenManager.saveTokens(
            data.access_token,
            data.refresh_token || null,
            data.expires_in || 3600 // Default to 1 hour if not provided
          )
        }



        window.location.href = '/?auth=success'

      } catch (error) {
        console.error('Authentication error:', error)
        window.location.href = '/?error=' + encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')
      }
    }

    handleAuth()
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: 'Inter, sans-serif',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(0, 212, 255, 0.2)',
          borderTop: '4px solid #00d4ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Completing authentication...</h1>
        <p style={{ opacity: 0.7 }}>Please wait</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}