'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  
  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">OAuth Configuration Debug</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Current configuration values</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Google Client ID:</strong>
              <div className="font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                {clientId || 'NOT SET'}
              </div>
            </div>
            
            <div>
              <strong>Backend URL:</strong>
              <div className="font-mono bg-gray-100 p-2 rounded mt-1">
                {backendUrl || 'NOT SET'}
              </div>
            </div>
            
            <div>
              <strong>Redirect URI:</strong>
              <div className="font-mono bg-gray-100 p-2 rounded mt-1">
                {redirectUri}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Cloud Console Setup</CardTitle>
            <CardDescription>Required configuration steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. OAuth Consent Screen</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>User type: External</li>
                <li>Add your email as a test user</li>
                <li>Add required scopes: email, profile, drive.readonly, documents.readonly</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">2. OAuth 2.0 Client</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Application type: Web application</li>
                <li>Authorized JavaScript origins: <code className="bg-gray-100 px-1 rounded">http://localhost:3000</code></li>
                <li>Authorized redirect URIs: <code className="bg-gray-100 px-1 rounded">{redirectUri}</code></li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">3. Required APIs</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Google Drive API</li>
                <li>Google Docs API</li>
                <li>Google+ API (for profile)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`flex items-center space-x-2 ${clientId ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-3 h-3 rounded-full ${clientId ? 'bg-green-600' : 'bg-red-600'}`}></div>
                <span>Google Client ID: {clientId ? 'Configured' : 'Missing'}</span>
              </div>
              <div className={`flex items-center space-x-2 ${backendUrl ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-3 h-3 rounded-full ${backendUrl ? 'bg-green-600' : 'bg-red-600'}`}></div>
                <span>Backend URL: {backendUrl ? 'Configured' : 'Missing'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}