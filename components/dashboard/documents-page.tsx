'use client'

import React from 'react'
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

// SVG Icons
const FolderIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
)

const DatabaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
)

const RefreshIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
)

const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
)

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
)

const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
)

const ArrowLeftIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
)

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)

const UploadIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
)

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
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto">
                {/* Header with Inline Notification */}
                <div className="mb-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent mb-2">
                                Documents Management
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Kelola dokumen Google Drive dan Knowledge Base Anda
                            </p>
                        </div>

                        {/* Inline Message Display */}
                        {message && (
                            <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 px-4 py-2.5 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Status Indicator */}
                                <div className={`w-2 h-2 rounded-full ${message.includes('berhasil') || message.includes('dimuat')
                                    ? 'bg-green-500'
                                    : message.includes('gagal') || message.includes('error')
                                        ? 'bg-red-500'
                                        : 'bg-blue-500'
                                    }`} />

                                {/* Message Text */}
                                <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                    {message}
                                </p>
                            </div>
                        )}
                    </div>
                </div>


                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Google Drive Section */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-2xl flex flex-col max-h-[750px]">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-4 text-white relative overflow-hidden flex-shrink-0">
                            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                            <FolderIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Google Drive</h2>
                                            {/* Breadcrumb for subfolder */}
                                            {folderHistory.length > 0 ? (
                                                <div className="flex items-center gap-1.5 text-sm text-blue-100">
                                                    <span className="opacity-70">Root</span>
                                                    {folderHistory.map((folder, index) => (
                                                        <React.Fragment key={folder.id}>
                                                            <span className="opacity-50">/</span>
                                                            <span className={index === folderHistory.length - 1 ? 'font-semibold' : 'opacity-70'}>
                                                                {folder.name}
                                                            </span>
                                                        </React.Fragment>
                                                    ))}
                                                    {currentFolderName && currentFolderName !== folderHistory[folderHistory.length - 1]?.name && (
                                                        <>
                                                            <span className="opacity-50">/</span>
                                                            <span className="font-semibold">{currentFolderName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-blue-100">
                                                    {isShowingRecentFiles ? 'Dokumen Terbaru' : currentFolderName || 'Pilih dokumen'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={() => setShowFolderInput(!showFolderInput)}
                                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-white/20"
                                    >
                                        <FolderIcon className="w-4 h-4" />
                                        Folder URL
                                    </Button>
                                    {(currentFolderId || folderHistory.length > 0) && (
                                        <Button
                                            onClick={onBackToParent}
                                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-white/20"
                                        >
                                            <ArrowLeftIcon className="w-4 h-4" />
                                            Back
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => {
                                            fetchDocuments()
                                            fetchKnowledgeBase()
                                        }}
                                        disabled={isLoading}
                                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-white/20 disabled:opacity-50"
                                    >
                                        <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Folder URL Input */}
                        {showFolderInput && (
                            <div className="p-5 bg-blue-50/50 dark:bg-gray-700/50 border-b border-blue-100 dark:border-gray-600">
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="https://drive.google.com/drive/folders/..."
                                        value={folderUrl}
                                        onChange={(e) => setFolderUrl(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-blue-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                if (folderUrl.trim()) {
                                                    fetchAllDocumentsFromFolder(folderUrl.trim())
                                                }
                                            }}
                                            disabled={isLoadingFolder || !folderUrl.trim()}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <SearchIcon className="w-4 h-4" />
                                            Buka Folder
                                        </Button>
                                        <Button
                                            onClick={onBulkUploadFromFolder}
                                            disabled={isBulkUploading || !folderUrl.trim()}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <UploadIcon className="w-4 h-4" />
                                            Upload Semua
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bulk Upload Progress */}
                        {isBulkUploading && (
                            <div className="p-5 bg-blue-50/50 dark:bg-gray-700/50 border-b border-blue-100 dark:border-gray-600">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">{bulkUploadStatus}</p>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-400 mb-2">
                                    <span>{bulkUploadProgress.current} / {bulkUploadProgress.total}</span>
                                    <span>{bulkUploadProgress.percentage}%</span>
                                </div>
                                <div className="w-full bg-blue-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${bulkUploadProgress.percentage}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Search and Controls */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Cari dokumen..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                                    />
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'name' | 'modified' | 'size')}
                                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="modified">Terbaru</option>
                                    <option value="name">Nama</option>
                                    <option value="size">Ukuran</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 text-xs">
                                    <span className="bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">
                                        {filteredAndSortedDocuments.length} file
                                    </span>
                                    {selectedDocs.size > 0 && (
                                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 font-medium">
                                            {selectedDocs.size} dipilih
                                        </span>
                                    )}
                                </div>
                                <Button
                                    onClick={onAddToKnowledgeBase}
                                    disabled={selectedDocs.size === 0}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <PlusIcon className="w-3.5 h-3.5" />
                                    Add to KB ({selectedDocs.size})
                                </Button>
                            </div>
                        </div>

                        {/* Documents List */}
                        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent" />
                                </div>
                            ) : (filteredAndSortedFolders.length > 0 || filteredAndSortedDocuments.length > 0) ? (
                                <div className="space-y-2">
                                    {/* Folders */}
                                    {filteredAndSortedFolders.map((folder, index) => (
                                        <div
                                            key={folder.id}
                                            onClick={() => onFolderClick(folder)}
                                            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-white dark:from-gray-700 dark:to-gray-750 hover:from-blue-100 hover:to-blue-50 dark:hover:from-gray-650 dark:hover:to-gray-700 rounded-xl border border-blue-100 dark:border-gray-600 cursor-pointer transition-all hover:shadow-md group"
                                        >
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                                                <FolderIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{folder.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(folder.modified_time)}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Documents */}
                                    {filteredAndSortedDocuments.map((doc, index) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => onSelectDoc(doc.id, index)}
                                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md group ${selectedDocs.has(doc.id)
                                                ? 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/20 border-blue-300 dark:border-blue-700'
                                                : 'bg-white dark:bg-gray-750 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                                                }`}
                                        >
                                            <span className="text-2xl">{getFileIcon(doc.mime_type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{doc.name}</p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    <span>{getFileTypeName(doc.mime_type)}</span>
                                                    <span>•</span>
                                                    <span>{formatFileSize(doc.size)}</span>
                                                    {/* Subfolder Badge - shows if file is from a subfolder */}
                                                    {doc.source_subfolder && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                                                                <FolderIcon className="w-3 h-3 mr-1" />
                                                                {doc.source_subfolder}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedDocs.has(doc.id) && (
                                                <div className="p-1.5 bg-blue-600 rounded-full">
                                                    <CheckIcon className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                                        <FolderIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-medium">Tidak ada dokumen</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Knowledge Base Section */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-2xl flex flex-col max-h-[750px]">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-4 text-white relative overflow-hidden flex-shrink-0">
                            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                            <DatabaseIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Knowledge Base</h2>
                                            <p className="text-sm text-blue-100">{knowledgeBase.length} dokumen</p>
                                        </div>
                                    </div>
                                </div>

                                {knowledgeBase.length > 0 && (
                                    <Button
                                        onClick={onClearAllDocuments}
                                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-white/20"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Clear All ({knowledgeBase.length})
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Knowledge Base List */}
                        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
                            {knowledgeBase.length > 0 ? (
                                <div className="space-y-2">
                                    {knowledgeBase.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-white dark:from-gray-700 dark:to-gray-750 rounded-xl border border-blue-100 dark:border-gray-600 transition-all hover:shadow-md group"
                                        >
                                            <span className="text-2xl">{getFileIcon(doc.mime_type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{doc.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{getFileTypeName(doc.mime_type)}</p>
                                                    {doc.chunk_count && doc.chunk_count > 0 && (
                                                        <>
                                                            <span className="text-xs text-gray-400">•</span>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                                                                {doc.chunk_count} chunks
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onRemoveFromKnowledgeBase(doc.id)}
                                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                                        <DatabaseIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-medium text-center">
                                        Knowledge Base kosong<br />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Tambahkan dokumen dari Google Drive</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
