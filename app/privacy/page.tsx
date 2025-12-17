'use client'

import { useState, useEffect } from 'react'

export default function PrivacyPolicy() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const darkMode = savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 dark:from-gray-900 dark:via-black dark:to-gray-900 text-white p-8">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300 shadow-lg hover:scale-110"
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-white/70 text-lg">How we protect and handle your data</p>
        </div>

        <div className="space-y-8">
          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">1</span>
              Information We Collect
            </h2>
            <p className="text-white/90 mb-4">
              DORA (Document Retrieval Assistant) collects the following information when you use our service:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
              <li><strong className="text-white">Google Account Information:</strong> Email address, name, and profile picture from your Google account</li>
              <li><strong className="text-white">Google Drive Documents:</strong> Access to documents you explicitly authorize us to read</li>
              <li><strong className="text-white">Usage Data:</strong> Chat queries and interactions with the AI assistant</li>
            </ul>
          </section>

          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">2</span>
              How We Use Your Information
            </h2>
            <p className="text-white/90 mb-4">We use your information to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
              <li>Authenticate your identity and provide secure access to the application</li>
              <li>Access and process your Google Drive documents for AI-powered search</li>
              <li>Generate intelligent responses to your queries using RAG technology</li>
              <li>Improve our service and user experience</li>
            </ul>
          </section>

          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">3</span>
              Data Storage and Security
            </h2>
            <p className="text-white/90 mb-4">
              Your document embeddings are stored securely in our ChromaDB vector database. We implement industry-standard
              security measures including:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
              <li>Encrypted data transmission (HTTPS)</li>
              <li>Secure authentication using Google OAuth 2.0</li>
              <li>User-specific data isolation</li>
              <li>Regular security updates and monitoring</li>
            </ul>
          </section>

          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">4</span>
              Third-Party Services
            </h2>
            <p className="text-white/90 mb-4">DORA integrates with the following third-party services:</p>
            <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
              <li><strong className="text-white">Google Drive API:</strong> To access your documents</li>
              <li><strong className="text-white">Google OAuth 2.0:</strong> For secure authentication</li>
              <li><strong className="text-white">Groq/Gemini AI:</strong> For generating intelligent responses</li>
            </ul>
          </section>

          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">5</span>
              Your Rights
            </h2>
            <p className="text-white/90 mb-4">You have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
              <li>Access your personal data</li>
              <li>Delete your data from our system</li>
              <li>Revoke Google Drive access at any time</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">6</span>
              Data Retention
            </h2>
            <p className="text-white/90">
              We retain your data only as long as necessary to provide our services. You can delete your knowledge base
              at any time through the application interface.
            </p>
          </section>

          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">7</span>
              Contact Us
            </h2>
            <p className="text-white/90">
              If you have any questions about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:suryahanajaya76@gmail.com" className="text-white font-semibold hover:underline transition-all">
                suryahanajaya76@gmail.com
              </a>
            </p>
          </section>

          <div className="text-center py-8 border-t border-white/20">
            <p className="text-white/60 text-sm">Last updated: December 16, 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
