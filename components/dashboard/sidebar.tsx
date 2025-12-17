'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ChatSession {
    id: string;
    title: string;
    messages: any[];
    createdAt: number;
    updatedAt: number;
}

interface SidebarProps {
    chatHistory: Array<{
        role: 'user' | 'assistant'
        content: string
        sources?: Array<string | { id: string; name: string; type: string; link?: string }>
        from_documents?: boolean
    }>
    onNewChat: () => void
    currentView: 'chat' | 'documents'
    onViewChange: (view: 'chat' | 'documents') => void
    chatSessions: ChatSession[]
    activeChatId: string | null
    onSwitchChat: (sessionId: string) => void
    onDeleteChat: (sessionId: string) => void
}

export function Sidebar({
    chatHistory,
    onNewChat,
    currentView,
    onViewChange,
    chatSessions,
    activeChatId,
    onSwitchChat,
    onDeleteChat
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const messageCount = chatHistory.length

    const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onDeleteChat(sessionId)
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Collapsible Sidebar with Red Gradient */}
            <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-red-600 via-red-700 to-red-800 dark:from-gray-800 dark:via-gray-900 dark:to-black text-white flex flex-col h-screen shadow-xl relative`}
                style={{
                    transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {/* Toggle Button - Desktop Only - Positioned at center between sidebar and content */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-700 rounded-full shadow-lg items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors z-10 border border-gray-200 dark:border-gray-600"
                    style={{
                        transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <span className="text-red-600 dark:text-cyan-400 text-xs font-bold">
                        {isCollapsed ? '›' : '‹'}
                    </span>
                </button>

                {/* Header */}
                <div className="p-4 border-b border-white/20">
                    {!isCollapsed ? (
                        <Button
                            onClick={onNewChat}
                            className="w-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl font-semibold border border-white/30"
                        >
                            <span className="text-lg">+</span>
                            <span className="font-semibold">New Chat</span>
                        </Button>
                    ) : (
                        <button
                            onClick={onNewChat}
                            className="w-full aspect-square bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all border border-white/20"
                        >
                            <span className="text-2xl font-bold">+</span>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto p-3">
                    <div className="space-y-2">
                        {/* Chat View Button */}
                        <button
                            onClick={() => onViewChange('chat')}
                            className={`w-full text-left transition-all ${isCollapsed
                                ? `aspect-square rounded-lg flex items-center justify-center ${currentView === 'chat'
                                    ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30'
                                    : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/20'
                                }`
                                : `px-4 py-3 rounded-xl ${currentView === 'chat'
                                    ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30'
                                    : 'hover:bg-white/10 text-white/80 hover:text-white'
                                }`
                                }`}
                            title="Chat"
                        >
                            {!isCollapsed ? (
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-sm">Chat</p>
                                        <p className="text-xs text-white/70">{messageCount} messages</p>
                                    </div>
                                </div>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            )}
                        </button>

                        {/* Documents View Button */}
                        <button
                            onClick={() => onViewChange('documents')}
                            className={`w-full text-left transition-all ${isCollapsed
                                ? `aspect-square rounded-lg flex items-center justify-center ${currentView === 'documents'
                                    ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30'
                                    : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/20'
                                }`
                                : `px-4 py-3 rounded-xl ${currentView === 'documents'
                                    ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30'
                                    : 'hover:bg-white/10 text-white/80 hover:text-white'
                                }`
                                }`}
                            title="Documents"
                        >
                            {!isCollapsed ? (
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-sm">Documents</p>
                                        <p className="text-xs text-white/70">Manage files</p>
                                    </div>
                                </div>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Chat History Section */}
                    {!isCollapsed && chatSessions.length > 0 && (
                        <div className="mt-6">
                            <p className="text-xs text-white/60 font-semibold uppercase tracking-wide px-4 mb-3">Chat History</p>
                            <div className="space-y-1">
                                {chatSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`group px-3 py-3 rounded-xl cursor-pointer transition-all border ${session.id === activeChatId
                                            ? 'bg-white/20 border-white/30'
                                            : 'border-transparent hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div
                                                className="flex-1 min-w-0"
                                                onClick={() => onSwitchChat(session.id)}
                                            >
                                                <p className="text-sm font-medium truncate text-white">
                                                    {session.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-white/60">
                                                        {session.messages.length} msgs
                                                    </p>
                                                    <span className="text-white/40">•</span>
                                                    <p className="text-xs text-white/60">
                                                        {formatDate(session.updatedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteClick(session.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all"
                                                title="Delete chat"
                                            >
                                                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isCollapsed && (
                    <div className="p-4 border-t border-white/20 space-y-3">
                        <p className="text-xs text-white/70 text-center font-medium">DORA AI Assistant</p>
                        <div className="flex flex-col gap-2">
                            <a
                                href="/privacy"
                                target="_blank"
                                className="text-xs text-white/60 hover:text-white text-center transition-colors duration-200 hover:underline"
                            >
                                Privacy Policy
                            </a>
                            <a
                                href="/terms"
                                target="_blank"
                                className="text-xs text-white/60 hover:text-white text-center transition-colors duration-200 hover:underline"
                            >
                                Terms of Service
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
