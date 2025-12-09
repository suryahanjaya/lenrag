'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, MessageSquare, Brain, Shield } from 'lucide-react'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { Dashboard } from '@/components/dashboard/dashboard'
import { User } from '@/lib/types'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
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

    // Check for auth success parameter
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get('auth')

    if (authSuccess === 'success') {
      // Clean up URL parameter immediately
      window.history.replaceState({}, document.title, window.location.pathname)
      // Check auth state immediately
      checkAuth()
    } else {
      // Check auth immediately
      checkAuth()
    }
  }, [])

  const handleAuthSuccess = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    // Token will be set by the auth callback page
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/Logo.png"
              alt="DORA Logo"
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            DORA - Document Retrieval Assistant
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your documents into an intelligent knowledge base.
            DORA can understand legal, academic, technical, business, medical, and financial documents.
          </p>
          <GoogleAuthButton onSuccess={handleAuthSuccess} />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle className="text-lg">Secure Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sign in securely with your Google account using OAuth 2.0
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-red-500 mb-2" />
              <CardTitle className="text-lg">Document Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access and select from all your Google Docs seamlessly
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 text-rose-600 mb-2" />
              <CardTitle className="text-lg">DORA Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Universal document understanding for all types of content
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-red-700 mb-2" />
              <CardTitle className="text-lg">Smart Fallback</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get general knowledge answers when your docs don't have the info
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect & Select</h3>
              <p className="text-gray-600">
                Sign in with Google and choose which documents to add to your knowledge base
              </p>
            </div>

            <div className="text-center">
              <div className="bg-rose-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-rose-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">DORA Processing</h3>
              <p className="text-gray-600">
                DORA intelligently processes various document types and creates smart embeddings for universal retrieval
              </p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-700">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ask & Learn</h3>
              <p className="text-gray-600">
                Ask questions in natural language and get accurate answers from your documents
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}