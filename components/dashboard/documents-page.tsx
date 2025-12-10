'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Document, KnowledgeBaseDocument } from '@/lib/types'
import { getFileIcon, getFileTypeName, formatFileSize } from '@/lib/utils/fileHelpers'
import { formatDate } from '@/lib/utils/formatting'

interface DocumentsPageProps {
    documents: Document[]
    knowledgeBase: KnowledgeBaseDocument[]
    selectedDocs: Set<string>
    isLoading: boolean
    message: string
    searchTerm: string
    sortBy: 'name' | 'modified' | 'size'
    isMultiSelectMode: boolean
    folderUrl: string
    isLoadingFolder: boolean
    showFolderInput: boolean
    isShowingRecentFiles: boolean
    currentFolderId: string | null
    currentFolderName: string
    folderHistory: Array<{ id: string; name: string }>
    isBulkUploading: boolean
    bulkUploadProgress: { current: number; total: number; percentage: number }
    bulkUploadStatus: string

    onSelectDoc: (docId: string, index?: number) => void
    onFolderClick: (folder: Document) => void
    onBackToParent: () => void
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, docId: string, index: number) => void
    onAddToKnowledgeBase: () => void
    onRemoveFromKnowledgeBase: (docId: string) => void
    onClearAllDocuments: () => void
    onBulkUploadFromFolder: () => void
    fetchDocuments: () => void
    fetchKnowledgeBase: () => void
    fetchAllDocumentsFromFolder: (url: string) => void
    setSearchTerm: (term: string) => void
    setSortBy: (sort: 'name' | 'modified' | 'size') => void
    setIsMultiSelectMode: (mode: boolean) => void
    setFolderUrl: (url: string) => void
    setShowFolderInput: (show: boolean) => void
    setIsShowingRecentFiles: (show: boolean) => void
    setMessage: (msg: string) => void
}

export function DocumentsPage({
    documents,
    knowledgeBase,
    selectedDocs,
    isLoading,
    message,
    searchTerm,
    sortBy,
    isMultiSelectMode,
    folderUrl,
    isLoadingFolder,
    showFolderInput,
    isShowingRecentFiles,
    currentFolderId,
    currentFolderName,
    folderHistory,
    isBulkUploading,
    bulkUploadProgress,
    bulkUploadStatus,
    onSelectDoc,
    onFolderClick,
    onBackToParent,
    onKeyDown,
    onAddToKnowledgeBase,
    onRemoveFromKnowledgeBase,
    onClearAllDocuments,
    onBulkUploadFromFolder,
    fetchDocuments,
    fetchKnowledgeBase,
    fetchAllDocumentsFromFolder,
    setSearchTerm,
    setSortBy,
    setIsMultiSelectMode,
    setFolderUrl,
    setShowFolderInput,
    setIsShowingRecentFiles,
    setMessage
}: DocumentsPageProps) {

    // Organize content
    const folders = documents.filter((doc: Document) => doc.is_folder)
    const docs = documents.filter((doc: Document) => !doc.is_folder)

    // Filter and sort
    const filteredAndSortedDocuments = docs
        .filter((doc: Document) => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a: Document, b: Document) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name)
                case 'modified':
                    return new Date(b.modified_time || '').getTime() - new Date(a.modified_time || '').getTime()
                case 'size':
                    return (parseInt(b.size || '0') - parseInt(a.size || '0'))
                default:
                    return 0
            }
        })

    const filteredAndSortedFolders = folders
        .filter((folder: Document) => folder.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a: Document, b: Document) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name)
                case 'modified':
                    return new Date(b.modified_time || '').getTime() - new Date(a.modified_time || '').getTime()
                case 'size':
                    return (parseInt(b.size || '0') - parseInt(a.size || '0'))
                default:
                    return 0
            }
        })

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">📁 Documents Management</h1>
                    <p className="text-gray-600">Kelola dokumen Google Drive dan Knowledge Base Anda</p>
                </div>

                {/* Message Display */}
                {message && (
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 p-4 mb-6">
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${message.includes('berhasil') || message.includes('dimuat')
                                ? 'bg-green-500'
                                : message.includes('gagal') || message.includes('error')
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
                                }`} />
                            <p className="text-sm font-medium text-gray-800">{message}</p>
                        </div>
                    </div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Google Drive Section */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">📁</span>
                                    <div>
                                        <h2 className="text-xl font-bold">Google Drive</h2>
                                        <p className="text-sm text-red-100">
                                            {isShowingRecentFiles ? 'Dokumen Terbaru' : currentFolderName || 'Pilih dokumen'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={() => setShowFolderInput(!showFolderInput)}
                                    className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg"
                                >
                                    📁 Folder URL
                                </Button>
                                {(currentFolderId || folderHistory.length > 0) && (
                                    <Button
                                        onClick={onBackToParent}
                                        className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg"
                                    >
                                        ← Back
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        fetchDocuments()
                                        fetchKnowledgeBase()
                                    }}
                                    disabled={isLoading}
                                    className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg"
                                >
                                    {isLoading ? '⏳' : '🔄'} Refresh
                                </Button>
                            </div>
                        </div>

                        {/* Folder URL Input */}
                        {showFolderInput && (
                            <div className="p-4 bg-red-50 border-b border-red-100">
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="https://drive.google.com/drive/folders/..."
                                        value={folderUrl}
                                        onChange={(e) => setFolderUrl(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                if (folderUrl.trim()) {
                                                    fetchAllDocumentsFromFolder(folderUrl.trim())
                                                }
                                            }}
                                            disabled={isLoadingFolder || !folderUrl.trim()}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                                        >
                                            {isLoadingFolder ? '⏳' : '🔍'} Buka Folder
                                        </Button>
                                        <Button
                                            onClick={onBulkUploadFromFolder}
                                            disabled={isBulkUploading || !folderUrl.trim()}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                                        >
                                            {isBulkUploading ? '⏳' : '📁'} Upload Semua
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bulk Upload Progress */}
                        {isBulkUploading && (
                            <div className="p-4 bg-blue-50 border-b border-blue-100">
                                <p className="text-sm font-medium text-blue-900 mb-2">{bulkUploadStatus}</p>
                                <div className="flex justify-between text-xs text-blue-700 mb-1">
                                    <span>{bulkUploadProgress.current} / {bulkUploadProgress.total}</span>
                                    <span>{bulkUploadProgress.percentage}%</span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${bulkUploadProgress.percentage}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Search and Controls */}
                        <div className="p-4 border-b border-gray-200 space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Cari dokumen..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'name' | 'modified' | 'size')}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="modified">📅 Terbaru</option>
                                    <option value="name">🔤 Nama</option>
                                    <option value="size">📏 Ukuran</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 text-xs">
                                    <span className="bg-gray-100 px-2 py-1 rounded">📁 {filteredAndSortedFolders.length} folder</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">📄 {filteredAndSortedDocuments.length} file</span>
                                    {selectedDocs.size > 0 && (
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded">✅ {selectedDocs.size} dipilih</span>
                                    )}
                                </div>
                                <Button
                                    onClick={onAddToKnowledgeBase}
                                    disabled={selectedDocs.size === 0}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs px-3 py-1 rounded"
                                >
                                    ➕ Add to KB ({selectedDocs.size})
                                </Button>
                            </div>
                        </div>

                        {/* Documents List */}
                        <div className="h-96 overflow-y-auto p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                                </div>
                            ) : (filteredAndSortedFolders.length > 0 || filteredAndSortedDocuments.length > 0) ? (
                                <div className="space-y-2">
                                    {/* Folders */}
                                    {filteredAndSortedFolders.map((folder, index) => (
                                        <div
                                            key={folder.id}
                                            onClick={() => onFolderClick(folder)}
                                            className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 cursor-pointer transition-all"
                                        >
                                            <span className="text-2xl">📁</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                                                <p className="text-xs text-gray-500">{formatDate(folder.modified_time)}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Documents */}
                                    {filteredAndSortedDocuments.map((doc, index) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => onSelectDoc(doc.id, index)}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedDocs.has(doc.id)
                                                ? 'bg-red-50 border-red-300'
                                                : 'bg-white hover:bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <span className="text-2xl">{getFileIcon(doc.mime_type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                                                <div className="flex gap-2 text-xs text-gray-500">
                                                    <span>{getFileTypeName(doc.mime_type)}</span>
                                                    <span>•</span>
                                                    <span>{formatFileSize(doc.size)}</span>
                                                </div>
                                            </div>
                                            {selectedDocs.has(doc.id) && (
                                                <span className="text-red-600">✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <span className="text-4xl mb-2">📁</span>
                                    <p>Tidak ada dokumen</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Knowledge Base Section */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🧠</span>
                                    <div>
                                        <h2 className="text-xl font-bold">Knowledge Base</h2>
                                        <p className="text-sm text-blue-100">{knowledgeBase.length} dokumen</p>
                                    </div>
                                </div>
                            </div>

                            {knowledgeBase.length > 0 && (
                                <Button
                                    onClick={onClearAllDocuments}
                                    className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg"
                                >
                                    🗑️ Clear All ({knowledgeBase.length})
                                </Button>
                            )}
                        </div>

                        {/* Knowledge Base List */}
                        <div className="h-[500px] overflow-y-auto p-4">
                            {knowledgeBase.length > 0 ? (
                                <div className="space-y-2">
                                    {knowledgeBase.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                                        >
                                            <span className="text-2xl">{getFileIcon(doc.mime_type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                                                <p className="text-xs text-gray-500">{getFileTypeName(doc.mime_type)}</p>
                                            </div>
                                            <button
                                                onClick={() => onRemoveFromKnowledgeBase(doc.id)}
                                                className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <span className="text-4xl mb-2">🧠</span>
                                    <p className="text-center">Knowledge Base kosong<br />Tambahkan dokumen dari Google Drive</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
