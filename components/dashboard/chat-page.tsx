'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { User } from '@/lib/types'
import { formatAIResponse, detectIncompleteResponse, getQuestionSuggestions } from '@/lib/utils/formatting'
import { getFileIcon, getFileTypeName } from '@/lib/utils/fileHelpers'

interface ChatPageProps {
    user: User | null
    chatHistory: Array<{
        role: 'user' | 'assistant'
        content: string
        sources?: Array<string | { id: string; name: string; type: string; link?: string }>
        from_documents?: boolean
    }>
    chatMessage: string
    isChatLoading: boolean
    knowledgeBaseCount: number
    onSendMessage: () => void
    onChatMessageChange: (message: string) => void
    onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function ChatPage({
    user,
    chatHistory,
    chatMessage,
    isChatLoading,
    knowledgeBaseCount,
    onSendMessage,
    onChatMessageChange,
    onKeyPress
}: ChatPageProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [currentTime, setCurrentTime] = useState(new Date())

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Get greeting based on time
    const getGreeting = () => {
        const hour = currentTime.getHours()
        if (hour >= 5 && hour < 12) return 'Good Morning'
        if (hour >= 12 && hour < 15) return 'Good Afternoon'
        if (hour >= 15 && hour < 18) return 'Good Evening'
        return 'Good Night'
    }

    // Get time-based colors
    const getTimeColors = () => {
        const hour = currentTime.getHours()
        if (hour >= 5 && hour < 12) {
            // Morning - Orange/Amber
            return {
                gradient: 'from-orange-500 to-amber-500',
                text: 'text-orange-600',
                bg: 'bg-orange-50',
                border: 'border-orange-200'
            }
        }
        if (hour >= 12 && hour < 15) {
            // Afternoon - Blue
            return {
                gradient: 'from-blue-500 to-cyan-500',
                text: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-200'
            }
        }
        if (hour >= 15 && hour < 18) {
            // Evening - Purple
            return {
                gradient: 'from-purple-500 to-pink-500',
                text: 'text-purple-600',
                bg: 'bg-purple-50',
                border: 'border-purple-200'
            }
        }
        // Night - Indigo
        return {
            gradient: 'from-indigo-500 to-blue-600',
            text: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-200'
        }
    }

    // Get gradient text for greeting based on time
    const getGreetingGradient = () => {
        const hour = currentTime.getHours()
        if (hour >= 5 && hour < 12) {
            // Pagi - Pink gradient
            return 'bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent'
        }
        if (hour >= 12 && hour < 15) {
            // Siang - Kuning gradient
            return 'bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent'
        }
        if (hour >= 15 && hour < 18) {
            // Sore - Orange gradient
            return 'bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent'
        }
        // Malam - Biru gradient
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent'
    }

    const timeColors = getTimeColors()
    const greetingGradient = getGreetingGradient()
    const greeting = getGreeting()
    const userName = user?.name || 'User'

    // Format time and date
    const formattedTime = currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
    const formattedDate = currentTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    // Component to render formatted chat message
    const renderFormattedMessage = (content: string, sources?: Array<string | { id: string; name: string; type: string; link?: string }>) => {
        // Extract sources from content if present
        let extractedSourceNames: string[] = []
        let cleanContent = content

        // Look for "Sumber:" pattern and extract source names
        const sourceMatch = content.match(/Sumber:\s*([^\n]+)/i)
        if (sourceMatch) {
            // Extract source names (split by comma, remove .pdf/.docx extensions for matching)
            const sourceText = sourceMatch[1]
            extractedSourceNames = sourceText
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)

            // Remove the "Sumber:" line from content
            cleanContent = content.replace(/Sumber:\s*[^\n]+\.?\s*/gi, '').trim()
        }

        const paragraphs = cleanContent.split('\n\n')
        const isIncomplete = detectIncompleteResponse(cleanContent)
        const suggestions = isIncomplete ? getQuestionSuggestions(cleanContent) : []

        return {
            content: (
                <div className="formatted-message-premium">
                    {paragraphs.map((paragraph, index) => {
                        const cleanedParagraph = paragraph
                            .replace(/^[\s]*[•\-\*]\s*/gm, '')
                            .replace(/^\s*\d+\.\s*/gm, '')
                            .replace(/^\s*[-•*]\s*/gm, '')
                            .trim()

                        if (!cleanedParagraph) return null

                        return (
                            <div key={index} className="mb-3">
                                <p className="text-gray-800 leading-relaxed text-[15px]">
                                    {cleanedParagraph}
                                </p>
                            </div>
                        )
                    })}

                    {isIncomplete && suggestions.length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-sm text-red-900 font-semibold mb-3">
                                Suggested Questions
                            </p>
                            <div className="text-sm text-red-800 space-y-2">
                                {suggestions.map((suggestion, index) => (
                                    <div key={index} className="flex items-start">
                                        <span className="mr-2 text-red-600 font-bold">•</span>
                                        <span>{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ),
            extractedSourceNames
        }
    }

    return (
        <div className="flex-1 flex flex-col h-screen bg-white">


            {/* Chat Messages Area */}
            <div className={`flex-1 overflow-y-auto ${chatHistory.length === 0 ? 'bg-gradient-to-br from-gray-50 via-white to-gray-50' : 'bg-gray-50 py-6 px-6'}`}>
                {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center relative overflow-hidden">
                        {/* Subtle Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.02]" style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
                            backgroundSize: '40px 40px'
                        }}></div>

                        <div className="w-full max-w-4xl mx-auto flex flex-col mt-[20vh] px-8 relative z-10">
                            {/* Logo and Greeting */}
                            <div className="flex items-center gap-6 mb-10">
                                {/* Logo DORA with subtle shadow */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full"></div>
                                    <img src="/1T.png" alt="DORA" className="h-20 w-20 relative z-10" />
                                </div>

                                {/* Greeting */}
                                <div>
                                    <div className="text-base text-gray-500 font-medium mb-1">
                                        {greeting},
                                    </div>
                                    <h1 className={`text-4xl font-bold tracking-tight ${(() => {
                                        const hour = currentTime.getHours();
                                        if (hour >= 5 && hour < 12) return 'bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent';
                                        if (hour >= 12 && hour < 15) return 'bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent';
                                        if (hour >= 15 && hour < 18) return 'bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent';
                                        return 'bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent';
                                    })()}`}>
                                        {userName}
                                    </h1>
                                </div>
                            </div>

                            {/* Chat Input Box */}
                            <div className="w-full mb-8">
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1 relative group">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={chatMessage}
                                            onChange={(e) => onChatMessageChange(e.target.value)}
                                            onKeyPress={onKeyPress}
                                            placeholder={knowledgeBaseCount === 0 ? "Add documents first..." : "Ask DORA anything..."}
                                            disabled={isChatLoading || knowledgeBaseCount === 0}
                                            className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 text-base placeholder:text-gray-400 shadow-sm hover:shadow-md group-hover:border-gray-300"
                                        />
                                    </div>
                                    <Button
                                        onClick={onSendMessage}
                                        disabled={!chatMessage.trim() || isChatLoading || knowledgeBaseCount === 0}
                                        className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 text-white px-6 py-4 rounded-2xl font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none h-[56px] min-w-[56px]"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </Button>
                                </div>

                                {/* Warning if no documents */}
                                {knowledgeBaseCount === 0 && (
                                    <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-sm text-amber-800 font-medium">
                                                Add documents to your knowledge base to start chatting
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick Suggestions - Only show if has documents */}
                            {knowledgeBaseCount > 0 && (
                                <div className="w-full">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Suggested Prompts</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => onChatMessageChange("Summarize the key points from my documents")}
                                            className="text-left px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 mb-1">Summarize documents</p>
                                                    <p className="text-xs text-gray-500">Get key points from your files</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => onChatMessageChange("What are the main topics covered?")}
                                            className="text-left px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 mb-1">Find topics</p>
                                                    <p className="text-xs text-gray-500">Discover main themes</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => onChatMessageChange("Extract important dates and deadlines")}
                                            className="text-left px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 mb-1">Extract dates</p>
                                                    <p className="text-xs text-gray-500">Find important deadlines</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => onChatMessageChange("Compare and contrast the documents")}
                                            className="text-left px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 mb-1">Compare docs</p>
                                                    <p className="text-xs text-gray-500">Analyze differences</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Knowledge Base Stats */}
                                    <div className="mt-6 px-5 py-4 bg-white border border-gray-200 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{knowledgeBaseCount} documents ready</p>
                                                    <p className="text-xs text-gray-500">Your knowledge base is active</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto">
                        <div className="space-y-6 w-full">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`${msg.role === 'user' ? 'max-w-2xl' : 'max-w-4xl w-full'}`}>
                                        {/* User Label */}
                                        {msg.role === 'user' && (
                                            <div className="flex items-center justify-end mb-2 px-1">
                                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">You</span>
                                            </div>
                                        )}

                                        {/* DORA Label */}
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center mb-2 px-1">
                                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">DORA</span>
                                            </div>
                                        )}

                                        <div className={`rounded-2xl px-5 py-4 ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md'
                                            : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                                            }`}>
                                            <div className="flex-1">
                                                {msg.role === 'assistant' ? (() => {
                                                    const result = renderFormattedMessage(msg.content, msg.sources)
                                                    const extractedSourceNames = result.extractedSourceNames

                                                    return (
                                                        <>
                                                            {result.content}

                                                            {/* Sources - Premium Style - Using extracted names from text */}
                                                            {extractedSourceNames.length > 0 && msg.sources && msg.sources.length > 0 && (() => {
                                                                // Match extracted source names with sources array to get links
                                                                const matchedSources = extractedSourceNames
                                                                    .map(sourceName => {
                                                                        // Find matching source in msg.sources
                                                                        return msg.sources?.find(source => {
                                                                            if (typeof source === 'object') {
                                                                                const name = source.name || source.id
                                                                                return name && sourceName.includes(name.replace(/\.(pdf|docx?|txt)$/i, ''))
                                                                            }
                                                                            return false
                                                                        })
                                                                    })
                                                                    .filter((source): source is { id: string; name: string; type: string; link?: string } =>
                                                                        source !== undefined && typeof source === 'object' && source.link !== undefined
                                                                    )

                                                                // Remove duplicates
                                                                const uniqueSources = matchedSources.filter((source, index, self) =>
                                                                    index === self.findIndex(s => s.name === source.name)
                                                                )

                                                                if (uniqueSources.length === 0) return null

                                                                return (
                                                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                                                        <p className="text-xs font-semibold text-gray-700 mb-3">
                                                                            Sumber:
                                                                        </p>
                                                                        <div className="space-y-2">
                                                                            {uniqueSources.map((source, idx) => (
                                                                                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 hover:border-red-200 transition-colors">
                                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-xs font-medium text-gray-900 truncate">
                                                                                                {source.name || source.id}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    {source.link && (
                                                                                        <a
                                                                                            href={source.link}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="text-xs text-red-600 hover:text-red-700 font-medium ml-3 whitespace-nowrap"
                                                                                        >
                                                                                            View
                                                                                        </a>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })()}
                                                        </>
                                                    )
                                                })() : (
                                                    <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
                                                        {msg.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Loading State - Premium */}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div>
                                        <div className="flex items-center mb-2 px-1">
                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">DORA</span>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className="text-sm text-gray-600">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
                }
            </div >

            {/* Chat Input - Only show at bottom when there are messages */}
            {
                chatHistory.length > 0 && (
                    <div className="border-t border-gray-200 px-6 py-5 bg-white shadow-lg">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex gap-3 items-center">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={chatMessage}
                                        onChange={(e) => onChatMessageChange(e.target.value)}
                                        onKeyPress={onKeyPress}
                                        placeholder={knowledgeBaseCount === 0 ? "Add documents first..." : "Ask me anything..."}
                                        disabled={isChatLoading || knowledgeBaseCount === 0}
                                        className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all text-lg placeholder:text-red-400"
                                    />
                                </div>
                                <Button
                                    onClick={onSendMessage}
                                    disabled={!chatMessage.trim() || isChatLoading || knowledgeBaseCount === 0}
                                    className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 text-white px-10 py-5 rounded-2xl font-semibold transition-all shadow-md hover:shadow-lg disabled:shadow-none text-lg h-[64px]"
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
