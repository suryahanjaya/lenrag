'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugAuthPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [localStorageData, setLocalStorageData] = useState<any>(null)

  useEffect(() => {
    // Check what's in localStorage
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user')
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')

      const data = {
        user: user ? JSON.parse(user) : null,
        accessToken: accessToken ? accessToken.substring(0, 20) + '...' : null,
        refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : null,
        fullAccessToken: accessToken
      }
      
      setLocalStorageData(data)
      console.log('LocalStorage contents:', data)
    }
  }, [])

  const testToken = async () => {
    setLoading(true)
    setError('')

    try {
      const googleToken = localStorage.getItem('access_token')
      
      if (!googleToken) {
        setError('No access token found in localStorage')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      
      console.log('Testing token with backend...')
      
      // Test token validation
      const tokenResponse = await fetch(`${backendUrl}/test-token`, {
        headers: {
          'Authorization': `Bearer mock-jwt-token`,
          'X-Google-Token': googleToken,
        },
      })

      const tokenResult = await tokenResponse.json()
      console.log('Token test result:', tokenResult)
      
      // If token is valid, try fetching documents
      if (tokenResult.status === 'valid') {
        console.log('Token is valid, testing document fetch...')
        
        const docsResponse = await fetch(`${backendUrl}/documents`, {
          headers: {
            'Authorization': `Bearer mock-jwt-token`,
            'X-Google-Token': googleToken,
          },
        })
        
        const docsResult = await docsResponse.json()
        console.log('Documents fetch result:', docsResult)
        
        setTokenInfo({
          tokenValidation: tokenResult,
          documentsFetch: {
            status: docsResponse.status,
            data: docsResult
          }
        })
      } else {
        setTokenInfo({
          tokenValidation: tokenResult,
          documentsFetch: { status: 'skipped', reason: 'Invalid token' }
        })
      }

    } catch (err) {
      console.error('Test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testDirectGoogleAPI = async () => {
    setLoading(true)
    setError('')

    try {
      const googleToken = localStorage.getItem('access_token')
      
      if (!googleToken) {
        setError('No access token found in localStorage')
        return
      }

      console.log('Testing Google Drive API directly...')
      
      // Test Google Drive API directly
      const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.document%27+and+trashed%3Dfalse&pageSize=10', {
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const driveResult = await driveResponse.json()
      console.log('Direct Google Drive API result:', driveResult)
      
      setTokenInfo({
        directGoogleAPI: {
          status: driveResponse.status,
          data: driveResult,
          headers: Object.fromEntries(driveResponse.headers.entries())
        }
      })

    } catch (err) {
      console.error('Direct API test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testBackendDriveAPI = async () => {
    setLoading(true)
    setError('')

    try {
      const googleToken = localStorage.getItem('access_token')
      
      if (!googleToken) {
        setError('No access token found in localStorage')
        return
      }

      console.log('Testing Backend Drive API...')
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/test-drive-direct`, {
        headers: {
          'Authorization': `Bearer mock-jwt-token`,
          'X-Google-Token': googleToken,
        },
      })
      
      const result = await response.json()
      console.log('Backend Drive API result:', result)
      
      setTokenInfo({
        backendDriveAPI: result
      })

    } catch (err) {
      console.error('Backend Drive API test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const clearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Debug</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Current Authentication Status</CardTitle>
            <CardDescription>Debug information about your authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>User:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto">
                {localStorageData?.user ? JSON.stringify(localStorageData.user, null, 2) : 'Not found'}
              </pre>
            </div>
            
            <div>
              <strong>Access Token:</strong>
              <div className="bg-gray-100 p-2 rounded mt-1 text-xs break-all">
                {localStorageData?.accessToken || 'Not found'}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={testToken} disabled={loading}>
                {loading ? 'Testing...' : 'Test Google Token'}
              </Button>
              <Button onClick={testDirectGoogleAPI} disabled={loading}>
                {loading ? 'Testing...' : 'Test Google API Direct'}
              </Button>
              <Button onClick={testBackendDriveAPI} disabled={loading}>
                {loading ? 'Testing...' : 'Test Backend Drive API'}
              </Button>
              <Button onClick={clearStorage} variant="destructive">
                Clear Storage & Restart
              </Button>
            </div>
          </CardContent>
        </Card>

        {tokenInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Token Test Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(tokenInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Make sure you've completed Google OAuth authentication</p>
            <p>2. Click "Test Google Token" to verify if your token is valid</p>
            <p>3. If token is invalid, click "Clear Storage & Restart" and authenticate again</p>
            <p>4. Check browser console for additional debug information</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}