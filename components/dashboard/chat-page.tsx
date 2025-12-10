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
        if (hour >= 5 && hour < 12) return 'Selamat Pagi'
        if (hour >= 12 && hour < 15) return 'Selamat Siang'
        if (hour >= 15 && hour < 18) return 'Selamat Sore'
        return 'Selamat Malam'
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

    const timeColors = getTimeColors()
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
            {/* Premium Header - Logo, Greeting, Time & Date in One Block */}
            <div className="border-b border-gray-100 px-6 py-5 bg-white shadow-sm">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        {/* Logo with Time Indicator */}
                        <div className="relative flex-shrink-0">
                            <img src="/Logo2.png" alt="DORA" className="h-14 w-14 rounded-xl shadow-md" />
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br ${timeColors.gradient} rounded-full border-2 border-white`}></div>
                        </div>

                        {/* Greeting */}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {greeting}, {userName.split(' ')[0]}
                            </h1>
                            {knowledgeBaseCount === 0 && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Knowledge Base is empty - Add documents first
                                </p>
                            )}
                        </div>

                        {/* Time & Date Block */}
                        <div className={`${timeColors.bg} ${timeColors.border} border-2 rounded-2xl px-5 py-3 shadow-sm flex-shrink-0`}>
                            <div className="text-right">
                                <div className={`text-2xl font-bold ${timeColors.text} font-mono tracking-tight leading-none`}>
                                    {formattedTime}
                                </div>
                                <div className="text-xs text-gray-600 mt-1.5 font-medium">
                                    {formattedDate}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Chat Messages - White Background */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
                <div className="max-w-5xl mx-auto h-full flex items-center justify-center">
                    {chatHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center w-full">
                            {/* Centered Logo like Gemini */}
                            <div className="mb-12">
                                <img src="/Logo2.png" alt="DORA" className="h-24 w-24 rounded-3xl shadow-xl mx-auto" />
                            </div>

                            {knowledgeBaseCount === 0 && (
                                <div className="mt-6 px-6 py-4 bg-white border border-red-100 rounded-2xl max-w-md shadow-sm">
                                    <p className="text-sm text-red-700 font-medium">
                                        Please add documents to your Knowledge Base to start chatting
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
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
                        </div>
                    )}

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

            {/* Chat Input - Premium White with Red Accent */}
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
        </div >
    )
}
