/**
 * File Helper Utilities
 * Extracted from dashboard.tsx to reduce code duplication
 */

/**
 * Get file type icon based on MIME type
 */
export const getFileIcon = (mimeType?: string): string => {
    if (!mimeType || typeof mimeType !== 'string') return '📄';
    if (mimeType.includes('google-apps.folder')) return '📁';
    if (mimeType.includes('google-apps.document')) return '📄';
    if (mimeType.includes('google-apps.presentation')) return '📊';
    if (mimeType.includes('pdf')) return '📘';
    if (mimeType.includes('wordprocessingml')) return '📝';
    if (mimeType.includes('presentationml')) return '📊';
    if (mimeType.includes('text/plain')) return '📄';
    return '📄';
};

/**
 * Get human-readable file type name based on MIME type
 */
export const getFileTypeName = (mimeType?: string): string => {
    if (!mimeType || typeof mimeType !== 'string') return 'Document';
    if (mimeType.includes('google-apps.folder')) return 'Folder';
    if (mimeType.includes('google-apps.document')) return 'Google Doc';
    if (mimeType.includes('google-apps.presentation')) return 'Google Slides';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('wordprocessingml')) return 'Word Doc';
    if (mimeType.includes('presentationml')) return 'PowerPoint';
    if (mimeType.includes('text/plain')) return 'Text File';
    return 'Document';
};

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (size?: string): string => {
    if (!size) return '';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
