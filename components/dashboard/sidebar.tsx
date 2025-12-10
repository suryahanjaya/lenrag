'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

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
}

export function Sidebar({ chatHistory, onNewChat, currentView, onViewChange }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const messageCount = chatHistory.length

    return (
        <>
            {/* Collapsible Sidebar with Red Gradient */}
            <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-red-600 via-red-700 to-red-800 text-white flex flex-col h-screen transition-all duration-300 shadow-xl relative`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-6 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                >
                    <span className="text-red-600 text-xs font-bold">
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
                            className="w-full bg-white/20 hover:bg-white/30 rounded-xl py-3 flex items-center justify-center transition-all"
                        >
                            <span className="text-xl">+</span>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto p-3">
                    <div className="space-y-2">
                        {/* Chat View Button */}
                        <button
                            onClick={() => onViewChange('chat')}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${currentView === 'chat'
                                ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30'
                                : 'hover:bg-white/10 text-white/80 hover:text-white'
                                }`}
                            title="Chat"
                        >
                            {!isCollapsed ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-sm">Chat</p>
                                        <p className="text-xs text-white/70">{messageCount} messages</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <span className="text-lg">💬</span>
                                </div>
                            )}
                        </button>

                        {/* Documents View Button */}
                        <button
                            onClick={() => onViewChange('documents')}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${currentView === 'documents'
                                ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30'
                                : 'hover:bg-white/10 text-white/80 hover:text-white'
                                }`}
                            title="Documents"
                        >
                            {!isCollapsed ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-sm">Documents</p>
                                        <p className="text-xs text-white/70">Manage files</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <span className="text-lg">📁</span>
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Recent Chats Section */}
                    {!isCollapsed && messageCount > 0 && (
                        <div className="mt-6">
                            <p className="text-xs text-white/60 font-semibold uppercase tracking-wide px-4 mb-3">Recent</p>
                            <div className="space-y-1">
                                <div className="px-4 py-3 rounded-xl hover:bg-white/10 cursor-pointer transition-all border border-transparent hover:border-white/20">
                                    <p className="text-sm font-medium truncate text-white">Current conversation</p>
                                    <p className="text-xs text-white/70 mt-1">{messageCount} messages</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isCollapsed && (
                    <div className="p-4 border-t border-white/20">
                        <p className="text-xs text-white/70 text-center font-medium">DORA AI Assistant</p>
                    </div>
                )}
            </div>
        </>
    )
}
