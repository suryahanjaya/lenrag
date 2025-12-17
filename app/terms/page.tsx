'use client'

import { useState, useEffect } from 'react'

export default function TermsOfService() {
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
                        Terms of Service
                    </h1>
                    <p className="text-white/70 text-lg">Our terms and conditions for using DORA</p>
                </div>

                <div className="space-y-8">
                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">1</span>
                            Acceptance of Terms
                        </h2>
                        <p className="text-white/90">
                            By accessing and using DORA (Document Retrieval Assistant), you accept and agree to be bound by the terms
                            and provision of this agreement. If you do not agree to these terms, please do not use our service.
                        </p>
                    </section>

                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">2</span>
                            Description of Service
                        </h2>
                        <p className="text-white/90 mb-4">
                            DORA is an AI-powered document retrieval and question-answering system that:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
                            <li>Integrates with your Google Drive to access documents</li>
                            <li>Uses advanced RAG (Retrieval-Augmented Generation) technology</li>
                            <li>Provides intelligent answers based on your document collection</li>
                            <li>Stores document embeddings for efficient retrieval</li>
                        </ul>
                    </section>

                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">3</span>
                            User Responsibilities
                        </h2>
                        <p className="text-white/90 mb-4">You agree to:</p>
                        <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
                            <li>Provide accurate and complete information during registration</li>
                            <li>Maintain the security of your Google account credentials</li>
                            <li>Use the service only for lawful purposes</li>
                            <li>Not attempt to gain unauthorized access to our systems</li>
                            <li>Not upload malicious content or violate intellectual property rights</li>
                        </ul>
                    </section>

                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">4</span>
                            Google Drive Access
                        </h2>
                        <p className="text-white/90 mb-4">
                            By authorizing DORA to access your Google Drive:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
                            <li>You grant us permission to read documents you explicitly select</li>
                            <li>We will only access documents necessary to provide our service</li>
                            <li>You can revoke access at any time through your Google account settings</li>
                            <li>We do not modify, delete, or share your Google Drive documents</li>
                        </ul>
                    </section>

                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">5</span>
                            Intellectual Property
                        </h2>
                        <p className="text-white/90">
                            You retain all rights to your documents and data. DORA and its original content, features, and functionality
                            are owned by Surya Hanjaya and are protected by international copyright, trademark, and other intellectual
                            property laws.
                        </p>
                    </section>

                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">6</span>
                            Limitation of Liability
                        </h2>
                        <p className="text-white/90 mb-4">
                            DORA is provided &quot;as is&quot; without warranties of any kind. We are not liable for:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
                            <li>Accuracy of AI-generated responses</li>
                            <li>Service interruptions or downtime</li>
                            <li>Data loss (though we implement best practices to prevent it)</li>
                            <li>Indirect, incidental, or consequential damages</li>
                        </ul>
                    </section>

                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">7</span>
                            Service Modifications
                        </h2>
                        <p className="text-white/90 mb-4">
                            We reserve the right to:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-3 text-white/80">
                            <li>Modify or discontinue the service at any time</li>
                            <li>Update these terms with reasonable notice</li>
                            <li>Implement usage limits or restrictions</li>
                        </ul>
                    </section>

                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">8</span>
                            Termination
                        </h2>
                        <p className="text-white/90">
                            We may terminate or suspend your access immediately, without prior notice, for any breach of these Terms.
                            You may also terminate your account at any time by revoking Google Drive access.
                        </p>
                    </section>

                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">9</span>
                            Governing Law
                        </h2>
                        <p className="text-white/90">
                            These Terms shall be governed by and construed in accordance with applicable laws, without regard to
                            conflict of law provisions.
                        </p>
                    </section>

                    <section className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-xl">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">10</span>
                            Contact Information
                        </h2>
                        <p className="text-white/90">
                            For questions about these Terms, please contact:{" "}
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
