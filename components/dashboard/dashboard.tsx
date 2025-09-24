'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TimeDisplay } from '@/components/ui/time-display';
import { User, Document, KnowledgeBaseDocument, Folder } from '@/lib/types';
import '../../styles.css';

interface DashboardProps {
  user: User | null;
  token: string | null;
  onLogout?: () => void;
}

export function Dashboard({ user, token, onLogout }: DashboardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cachedProfilePicture, setCachedProfilePicture] = useState<string | null>(null);
  const [profilePictureError, setProfilePictureError] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  
  // Bulk upload states
  const [isBulkUploadMode, setIsBulkUploadMode] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadStatus, setBulkUploadStatus] = useState('');

  // Helper function for error messages
  const setErrorMessage = (errorType: 'folder' | 'documents' | 'add' | 'remove' | 'general') => {
    const messages = {
      folder: 'Gagal memuat dokumen dari folder. Periksa URL folder dan coba lagi.',
      documents: 'Gagal memuat dokumen. Periksa koneksi internet dan coba lagi.',
      add: 'Gagal menambahkan dokumen. Periksa koneksi dan coba lagi.',
      remove: 'Gagal menghapus dokumen. Periksa koneksi dan coba lagi.',
      general: 'Terjadi kesalahan. Silakan coba lagi.'
    };
    setMessage(messages[errorType]);
  };

  // Helper function to format AI response with better structure
  const formatAIResponse = (content: string) => {
    // First, try to split by existing paragraph breaks
    let paragraphs = content.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
    
    // If no paragraph breaks exist, try to create them based on sentence patterns
    if (paragraphs.length === 1 && paragraphs[0].length > 200) {
      const text = paragraphs[0];
      
      // Split by sentences that end with periods followed by capital letters
      const sentences = text.split(/(?<=\.)\s+(?=[A-Z])/);
      
      // Group sentences into paragraphs (3-4 sentences per paragraph)
      const newParagraphs = [];
      let currentParagraph = [];
      
      for (let i = 0; i < sentences.length; i++) {
        currentParagraph.push(sentences[i]);
        
        // Create new paragraph every 3-4 sentences or at key phrases
        if (currentParagraph.length >= 3 || 
            sentences[i].includes('Selain itu') || 
            sentences[i].includes('Dalam') ||
            sentences[i].includes('Atas') ||
            sentences[i].includes('Sumber:') ||
            sentences[i].includes('Pembukaan') ||
            sentences[i].includes('Perjuangan') ||
            sentences[i].includes('Atas berkat') ||
            sentences[i].includes('Dan perjuangan') ||
            sentences[i].includes('Maka disusunlah') ||
            sentences[i].includes('Undang-Undang Dasar')) {
          newParagraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
      }
      
      // Add remaining sentences
      if (currentParagraph.length > 0) {
        newParagraphs.push(currentParagraph.join(' '));
      }
      
      paragraphs = newParagraphs;
    }
    
    // Format each paragraph
    let formatted = paragraphs.map(paragraph => {
      // Check if paragraph contains bullet points or numbered lists
      if (paragraph.includes('•') || paragraph.includes('-') || paragraph.includes('*') || /^\d+\./.test(paragraph)) {
        // Format as list
        const lines = paragraph.split('\n').filter(line => line.trim());
        const listItems = lines.map(line => {
          // Clean up bullet points
          const cleaned = line
            .replace(/^[•\-\*]\s*/, '• ')
            .replace(/^\d+\.\s*/, '• ')
            .trim();
          return cleaned;
        });
        return listItems.join('\n');
      }
      return paragraph;
    }).join('\n\n');

    // Add proper spacing and formatting
    formatted = formatted
      .replace(/\n\n+/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, ''); // Trim whitespace

    return formatted;
  };

  // Helper function to detect incomplete responses and suggest better questions
  const detectIncompleteResponse = (content: string) => {
    const incompleteIndicators = [
      'kurang lengkap',
      'tidak lengkap', 
      'sebagian',
      'beberapa',
      'sebagian besar',
      'umumnya'
    ];
    
    const hasIncompleteIndicator = incompleteIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
    
    return hasIncompleteIndicator;
  };

  // Helper function to suggest better questions for incomplete responses
  const getQuestionSuggestions = (content: string) => {
    const suggestions = [];
    
    if (content.includes('Pembukaan UUD') || content.includes('UUD 1945')) {
      suggestions.push(
        "Coba tanyakan: 'Berikan pembukaan UUD 1945 secara lengkap dan utuh'",
        "Atau: 'Tuliskan seluruh isi pembukaan UUD 1945 tanpa pengurangan'",
        "Atau: 'Sebutkan pembukaan UUD 1945 dari awal sampai akhir'"
      );
    }
    
    if (content.includes('pasal') || content.includes('Pasal')) {
      suggestions.push(
        "Coba tanyakan: 'Berikan penjelasan lengkap tentang pasal tersebut'",
        "Atau: 'Jelaskan secara detail isi pasal yang dimaksud'"
      );
    }
    
    return suggestions;
  };

  // Component to render formatted chat message
  const renderFormattedMessage = (content: string) => {
    const paragraphs = content.split('\n\n');
    const isIncomplete = detectIncompleteResponse(content);
    const suggestions = isIncomplete ? getQuestionSuggestions(content) : [];
    
    return (
      <div className="formatted-message">
        {paragraphs.map((paragraph, index) => {
          // Check if paragraph contains bullet points
          if (paragraph.includes('•') || paragraph.includes('-') || paragraph.includes('*')) {
            const lines = paragraph.split('\n').filter(line => line.trim());
            return (
              <div key={index} className="mb-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {lines.map((line, lineIndex) => (
                    <li key={lineIndex} className="text-gray-700 leading-relaxed">
                      {line.replace(/^[•\-\*]\s*/, '').trim()}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          
          // Regular paragraph with better spacing
          return (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed text-sm">
              {paragraph}
            </p>
          );
        })}
        
        {/* Show suggestions for incomplete responses */}
        {isIncomplete && suggestions.length > 0 && (
          <div className="suggestion-box">
            <h4>Saran untuk mendapatkan jawaban yang lebih lengkap:</h4>
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  const [chatHistory, setChatHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    sources?: Array<string | {
      id: string;
      name: string;
      type: string;
      link?: string;
    }>;
    from_documents?: boolean;
  }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('modified');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [chatAnimation, setChatAnimation] = useState<string>('');
  const [chatWindowAnimation, setChatWindowAnimation] = useState<string>('');
  const [showChatWindow, setShowChatWindow] = useState<boolean>(false);
  const [folderUrl, setFolderUrl] = useState<string>('');
  const [isLoadingFolder, setIsLoadingFolder] = useState<boolean>(false);
  const [showFolderInput, setShowFolderInput] = useState<boolean>(false);
  const [isShowingRecentFiles, setIsShowingRecentFiles] = useState<boolean>(false);
  
  // New simplified folder system
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('');
  const [folderHistory, setFolderHistory] = useState<Array<{id: string, name: string}>>([]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle chat button click with animation
  const handleChatToggle = () => {
    setChatAnimation('animate-chat-bounce');
    
    if (!isChatExpanded) {
      // Opening chat
      setTimeout(() => {
        setShowChatWindow(true);
        setIsChatExpanded(true);
        setChatWindowAnimation('animate-chat-slide-in');
        setChatAnimation('');
      }, 300);
    } else {
      // Closing chat
      setChatWindowAnimation('animate-chat-slide-out');
      setTimeout(() => {
        setShowChatWindow(false);
        setIsChatExpanded(false);
        setChatWindowAnimation('');
        setChatAnimation('');
      }, 300);
    }
  };

  // Get greeting and background based on time with premium gradients
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return { 
        text: 'Selamat Pagi', 
        emoji: '🌅', 
        color: 'text-white', 
        bgColor: 'from-pink-500 via-pink-600 to-pink-700', 
        glowColor: 'shadow-pink-200/50',
        backgroundGradient: 'from-white via-pink-50 to-pink-100',
        accentColors: ['white', 'pink-50', 'pink-100']
      };
    } else if (hour >= 12 && hour < 15) {
      return { 
        text: 'Selamat Siang', 
        emoji: '☀️', 
        color: 'text-white', 
        bgColor: 'from-yellow-500 via-yellow-600 to-yellow-700', 
        glowColor: 'shadow-yellow-200/50',
        backgroundGradient: 'from-white via-yellow-50 to-yellow-100',
        accentColors: ['white', 'yellow-50', 'yellow-100']
      };
    } else if (hour >= 15 && hour < 18) {
      return { 
        text: 'Selamat Sore', 
        emoji: '🌇', 
        color: 'text-white', 
        bgColor: 'from-orange-500 via-orange-600 to-orange-700', 
        glowColor: 'shadow-orange-200/50',
        backgroundGradient: 'from-white via-orange-50 to-orange-100',
        accentColors: ['white', 'orange-50', 'orange-100']
      };
    } else {
      return { 
        text: 'Selamat Malam', 
        emoji: '🌙', 
        color: 'text-white', 
        bgColor: 'from-blue-500 via-blue-600 to-blue-700', 
        glowColor: 'shadow-blue-200/50',
        backgroundGradient: 'from-white via-blue-50 to-blue-100',
        accentColors: ['white', 'blue-50', 'blue-100']
      };
    }
  };


  // Helper function to get file type icon
  const getFileIcon = (mimeType?: string) => {
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

  // Helper function to get file type name
  const getFileTypeName = (mimeType?: string) => {
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

  // Helper function to format file size
  const formatFileSize = (size?: string) => {
    if (!size) return '';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper function to format date - mobile optimized
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Use shorter format for mobile: DD/MM/YY, HH:MM
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }) + ', ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // New simplified content organization
  const organizedContent = useMemo(() => {
    // Separate folders and documents from the current documents array
    const folders = documents.filter((doc: Document) => doc.is_folder);
    const docs = documents.filter((doc: Document) => !doc.is_folder);
    
    
    return { folders: folders, documents: docs };
  }, [documents]);

  // Filter and sort documents
  const filteredAndSortedDocuments = organizedContent.documents
    .filter((doc: Document) => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: Document, b: Document) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'modified':
          return new Date(b.modified_time || '').getTime() - new Date(a.modified_time || '').getTime();
        case 'size':
          return (parseInt(b.size || '0') - parseInt(a.size || '0'));
        default:
          return 0;
      }
    });


  // Filter and sort folders
  const filteredAndSortedFolders = organizedContent.folders
    .filter((folder: Document) => 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: Document, b: Document) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'modified':
          return new Date(b.modified_time || '').getTime() - new Date(a.modified_time || '').getTime();
        case 'size':
          return (parseInt(b.size || '0') - parseInt(a.size || '0'));
        default:
          return 0;
      }
    });

  // Fungsi untuk mengambil SEMUA dokumen dari folder (termasuk subfolder)
  const fetchAllDocumentsFromFolder = async (url: string) => {
    
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      setIsLoadingFolder(false);
      return;
    }
    
    setIsLoadingFolder(true);
    setMessage('');
    
    try {
      const requestBody = { folder_url: url };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/from-folder-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Google-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });


      if (!response.ok) {
        const errorText = await response.text();
        // Silent error handling
        
        if (response.status === 401) {
          setMessage('Sesi telah berakhir. Silakan login ulang.');
        } else if (response.status === 403) {
          setMessage('Folder tidak dapat diakses. Pastikan folder sudah di-set public atau Anda memiliki akses ke folder tersebut.');
        } else {
          setMessage(`Gagal memuat dokumen dari folder: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      
      // Set documents from folder (NO FOLDERS, only documents)
      setDocuments(data || []);
      
      // Clear folder state
      setCurrentFolderId(null);
      setCurrentFolderName('');
      setFolderHistory([]);
      
      if (data && data.length > 0) {
        setMessage(`Berhasil memuat ${data.length} dokumen dari folder dan subfolder.`);
      } else {
        setMessage('Tidak ada dokumen ditemukan di folder tersebut.');
      }

    } catch (error) {
      // Silent error handling
      setErrorMessage('folder');
    } finally {
      setIsLoadingFolder(false);
    }
  };

  // Fungsi untuk mengambil dokumen dari folder Google Drive (original)
  const fetchDocumentsFromFolder = async (url: string) => {
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      setIsLoadingFolder(false);
      return;
    }
    
    setIsLoadingFolder(true);
    setMessage('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/from-folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Google-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder_url: url }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Silent error handling
        
        if (response.status === 401) {
          setMessage('Sesi telah berakhir. Silakan login ulang.');
        } else if (response.status === 403) {
          setMessage('Folder tidak dapat diakses. Pastikan folder sudah di-set public atau Anda memiliki akses ke folder tersebut.');
        } else {
          setMessage(`Gagal memuat dokumen dari folder: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      // Check if this is a fallback to recent files
      const isRecentFallback = data && data.length > 0 && data[0].is_recent_fallback;
      setIsShowingRecentFiles(isRecentFallback);
      
      // Set documents from folder
      setDocuments(data || []);
      
      // Clear folder state
      setCurrentFolderId(null);
      setCurrentFolderName('');
      setFolderHistory([]);
      
      if (data && data.length > 0) {
        if (isRecentFallback) {
          setMessage(`Folder tidak dapat diakses. Menampilkan ${data.length} dokumen terbaru dari Google Drive Anda.`);
        } else {
          setMessage(`Berhasil memuat ${data.length} dokumen dari folder.`);
        }
      } else {
        setMessage('Tidak ada dokumen ditemukan di folder tersebut.');
      }

    } catch (error) {
      console.error('Error fetching documents from folder:', error);
      setErrorMessage('folder');
    } finally {
      setIsLoadingFolder(false);
    }
  };

  // Fungsi untuk mengambil dokumen dari Google Drive (tanpa folder)
  const fetchDocuments = async () => {
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Google-Token': token,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Silent error handling
        
        if (response.status === 401) {
          setMessage('Sesi telah berakhir. Silakan login ulang.');
        } else if (response.status === 403) {
          setMessage('Tidak memiliki izin untuk mengakses Google Drive. Silakan cek pengaturan OAuth.');
        } else {
          setMessage(`Gagal memuat dokumen: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      // Set documents (no folders)
      setDocuments(data || []);
      
      // Clear folder state
      setCurrentFolderId(null);
      setCurrentFolderName('');
      setFolderHistory([]);
      setIsShowingRecentFiles(false);
      
      if (data && data.length > 0) {
        setMessage(`Berhasil dimuat ${data.length} dokumen dari Google Drive Anda.`);
      } else {
        setMessage('Tidak ada dokumen ditemukan di Google Drive Anda.');
      }

    } catch (error) {
      // Silent error handling
      setErrorMessage('documents');
    } finally {
      setIsLoading(false);
    }
  };


  // Fungsi untuk mengambil knowledge base
  const fetchKnowledgeBase = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/knowledge-base`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKnowledgeBase(data.documents || []);
      } else {
        // Silent error handling
        setKnowledgeBase([]);
      }
    } catch (error) {
      // Silent error handling
      setKnowledgeBase([]);
    }
  };

  // Jalankan fetchDocuments ketika token tersedia
  useEffect(() => {
    
    if (token) {
      fetchDocuments();
      fetchKnowledgeBase();
    } else {
      // Jika tidak ada token, hentikan status memuat dan beri pesan.
      setIsLoading(false);
      setMessage("Token otentikasi tidak ditemukan. Silakan coba login ulang.");
    }
  }, [token]);

  // Profile picture caching effect
  useEffect(() => {
    if (user?.picture && user?.id) {
      const cacheKey = `profile_picture_${user.id}`;
      const base64CacheKey = `profile_picture_base64_${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      const base64Cached = localStorage.getItem(base64CacheKey);
      
      // Check for base64 cache first (more reliable)
      if (base64Cached) {
        try {
          const { data, timestamp } = JSON.parse(base64Cached);
          const now = Date.now();
          const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
          
          if (now - timestamp < cacheDuration) {
            setCachedProfilePicture(data);
            setProfilePictureError(false);
            return;
          } else {
            localStorage.removeItem(base64CacheKey);
          }
        } catch (error) {
          // Silent error handling
        }
      }
      
      if (cached) {
        try {
          const { url, timestamp } = JSON.parse(cached);
          const now = Date.now();
          const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
          
          if (now - timestamp < cacheDuration) {
            setCachedProfilePicture(url);
            setProfilePictureError(false);
            return;
          } else {
            localStorage.removeItem(cacheKey);
          }
        } catch (error) {
          // Silent error handling
        }
      }
      
      // If no valid cache, try to convert to base64
      convertImageToBase64(user.picture).then(base64 => {
        if (base64) {
          setCachedProfilePicture(base64);
          setProfilePictureError(false);
          
          // Cache the base64 data
          const base64CacheKey = `profile_picture_base64_${user.id}`;
          const cacheData = {
            data: base64,
            timestamp: Date.now()
          };
          localStorage.setItem(base64CacheKey, JSON.stringify(cacheData));
        } else {
          setCachedProfilePicture(user.picture || null);
          setProfilePictureError(false);
        }
      });
    }
  }, [user?.picture, user?.id]);

  // Function to retry loading profile picture
  const retryProfilePicture = () => {
    if (user?.picture && user?.id) {
      // Clear any existing cache and try again
      const cacheKey = `profile_picture_${user.id}`;
      localStorage.removeItem(cacheKey);
      setProfilePictureError(false);
      setCachedProfilePicture(user.picture);
    }
  };

  // Function to convert image to base64 as fallback
  const convertImageToBase64 = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return null;
    }
  };

  const handleSelectDoc = (docId: string, index?: number) => {
    setSelectedDocs((prev: Set<string>) => {
      const newSelection = new Set(prev);
      
      if (isMultiSelectMode && lastSelectedIndex !== null && index !== undefined) {
        // Range selection (Shift + Click)
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const allItems = [...filteredAndSortedFolders, ...filteredAndSortedDocuments];
        
        for (let i = start; i <= end; i++) {
          if (allItems[i] && 'id' in allItems[i]) {
            newSelection.add(allItems[i].id);
          }
        }
      } else {
        // Single selection or Ctrl + Click
      if (newSelection.has(docId)) {
        newSelection.delete(docId);
      } else {
        newSelection.add(docId);
      }
      }
      
      return newSelection;
    });
    setLastSelectedIndex(index || null);
  };

  // New simplified folder click handler - Fetch all documents recursively
  const handleFolderClick = (folder: Document) => {
    
    if (!folder.web_view_link) {
      setMessage('Folder tidak memiliki link yang valid.');
      return;
    }
    
    // Add to folder history
    setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);
    setSelectedDocs(new Set()); // Clear selection when navigating
    
    // Fetch ALL documents from the clicked folder (including subfolders)
    fetchAllDocumentsFromFolder(folder.web_view_link);
  };

  // New simplified back navigation
  const handleBackToParent = () => {
    if (folderHistory.length > 0) {
      // Go back to previous folder
      const newHistory = [...folderHistory];
      newHistory.pop(); // Remove current folder
      
      if (newHistory.length > 0) {
        // Go to previous folder
        const prevFolder = newHistory[newHistory.length - 1];
        setFolderHistory(newHistory);
        setCurrentFolderId(prevFolder.id);
        setCurrentFolderName(prevFolder.name);
        
        // Fetch documents from previous folder
        const folderUrl = `https://drive.google.com/drive/folders/${prevFolder.id}`;
        fetchAllDocumentsFromFolder(folderUrl);
      } else {
        // Go back to root
        setFolderHistory([]);
        setCurrentFolderId(null);
        setCurrentFolderName('');
        fetchDocuments(); // Load root documents
      }
    } else if (folderUrl) {
      // Go back to original folder URL
      fetchAllDocumentsFromFolder(folderUrl);
    } else {
      // Go back to root
      fetchDocuments();
    }
    
    setSelectedDocs(new Set()); // Clear selection when navigating
  };

  // Handle keyboard selection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, docId: string, index: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setIsMultiSelectMode(true);
      handleSelectDoc(docId, index);
    } else if (e.key === 'Escape') {
      setIsMultiSelectMode(false);
      setSelectedDocs(new Set());
      setLastSelectedIndex(null);
    }
  };

  // Fungsi untuk menambahkan dokumen ke knowledge base
  const handleAddToKnowledgeBase = async () => {
      if (selectedDocs.size === 0) {
          setMessage('Pilih setidaknya satu dokumen.');
          return;
      }
      
      if (!token) {
          setMessage('Token tidak tersedia. Silakan login ulang.');
          return;
      }
      
      setMessage('Menambahkan dokumen...');
      setIsLoading(true);
      
      try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/add`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'X-Google-Token': token,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ document_ids: Array.from(selectedDocs) }),
          });

          if (!response.ok) {
              const errorText = await response.text();
              // Silent error handling
              throw new Error(`Failed to add documents: ${response.status}`);
          }
          
          const result = await response.json();
          setMessage(`Berhasil menambahkan ${result.processed_count || selectedDocs.size} dokumen ke knowledge base!`);
          setSelectedDocs(new Set());
          
          // Refresh data
          fetchDocuments();
          // Add a small delay to ensure the backend has processed the documents
          setTimeout(() => {
            fetchKnowledgeBase();
          }, 2000);
          
      } catch (error) {
          // Silent error handling
          setErrorMessage('add');
      } finally {
          setIsLoading(false);
      }
  };

  // Bulk upload function for folder scanning and batch processing
  const handleBulkUploadFromFolder = async () => {
    if (!folderUrl.trim()) {
      setMessage('Masukkan URL folder terlebih dahulu.');
      return;
    }
    
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      return;
    }
    
    setIsBulkUploading(true);
    setBulkUploadProgress({ current: 0, total: 0, percentage: 0 });
    setBulkUploadStatus('Memindai folder...');
    
    try {
      // Get documents directly from folder without affecting the main documents state
      const requestBody = { folder_url: folderUrl.trim() };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/from-folder-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Google-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setMessage('Sesi telah berakhir. Silakan login ulang.');
        } else if (response.status === 403) {
          setMessage('Folder tidak dapat diakses. Pastikan folder sudah di-set public.');
        } else {
          setMessage(`Gagal memuat dokumen dari folder: ${response.status}`);
        }
        setIsBulkUploading(false);
        return;
      }

      const allDocuments = await response.json();
      
      if (!allDocuments || allDocuments.length === 0) {
        setMessage('Tidak ada dokumen yang ditemukan di folder.');
        setIsBulkUploading(false);
        return;
      }
      
      // Filter only PDF, DOC, DOCX files
      const supportedFiles = allDocuments.filter((doc: any) => {
        const fileName = doc.name.toLowerCase();
        return fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx');
      });
      
      if (supportedFiles.length === 0) {
        setMessage('Tidak ada file PDF, DOC, atau DOCX yang ditemukan di folder.');
        setIsBulkUploading(false);
        return;
      }
      
      setBulkUploadStatus(`Ditemukan ${supportedFiles.length} file yang didukung. Memulai upload...`);
      setBulkUploadProgress({ current: 0, total: supportedFiles.length, percentage: 0 });
      
      // Process in batches of 100
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < supportedFiles.length; i += batchSize) {
        batches.push(supportedFiles.slice(i, i + batchSize));
      }
      
      let totalProcessed = 0;
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        setBulkUploadStatus(`Memproses batch ${batchIndex + 1}/${batches.length} (${batch.length} file)...`);
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/add`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Google-Token': token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ document_ids: batch.map((doc: any) => doc.id) }),
          });
          
          if (!response.ok) {
            throw new Error(`Batch ${batchIndex + 1} failed: ${response.status}`);
          }
          
          const result = await response.json();
          totalProcessed += result.processed_count || batch.length;
          
          // Update progress
          const currentProgress = totalProcessed;
          const percentage = Math.round((currentProgress / supportedFiles.length) * 100);
          setBulkUploadProgress({ 
            current: currentProgress, 
            total: supportedFiles.length, 
            percentage 
          });
          
          // Small delay between batches to prevent overwhelming the server
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`Error processing batch ${batchIndex + 1}:`, error);
          setBulkUploadStatus(`Error pada batch ${batchIndex + 1}, melanjutkan...`);
        }
      }
      
      setBulkUploadStatus('Upload selesai! Memuat ulang data...');
      setMessage(`Bulk upload selesai! ${totalProcessed} dari ${supportedFiles.length} dokumen berhasil diupload.`);
      
      // Refresh data
      fetchDocuments();
      setTimeout(() => {
        fetchKnowledgeBase();
      }, 2000);
      
    } catch (error) {
      console.error('Bulk upload error:', error);
      setMessage('Gagal melakukan bulk upload. Periksa koneksi dan coba lagi.');
    } finally {
      setIsBulkUploading(false);
      setBulkUploadStatus('');
    }
  };

  // Clear all documents from knowledge base
  const handleClearAllDocuments = async () => {
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      return;
    }
    
    if (knowledgeBase.length === 0) {
      setMessage('Knowledge base sudah kosong.');
      return;
    }
    
    // Confirm before clearing
    if (!confirm(`Apakah Anda yakin ingin menghapus semua ${knowledgeBase.length} dokumen dari knowledge base? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    
    setMessage('Menghapus semua dokumen...');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/clear-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Google-Token': token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to clear documents: ${response.status}`);
      }
      
      setMessage(`Berhasil menghapus semua ${knowledgeBase.length} dokumen dari knowledge base!`);
      
      // Refresh data
      fetchKnowledgeBase();
      
    } catch (error) {
      console.error('Clear all error:', error);
      setMessage('Gagal menghapus dokumen. Periksa koneksi dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };
  
    // Fungsi untuk menghapus dokumen dari knowledge base
    const handleRemoveFromKnowledgeBase = async (docId: string) => {
        if (!token) {
            setMessage('Token tidak tersedia. Silakan login ulang.');
            return;
        }
        
        setMessage('Menghapus dokumen...');
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/${docId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                // Silent error handling
                throw new Error(`Failed to remove document: ${response.status}`);
            }
            
            setMessage('Dokumen berhasil dihapus dari knowledge base!');
            
            // Refresh data
            fetchDocuments();
            fetchKnowledgeBase();
            
        } catch (error) {
            // Silent error handling
            setErrorMessage('remove');
        }
    };

  // Fungsi untuk mengirim pesan chat
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) {
      setMessage('Masukkan pesan terlebih dahulu.');
      return;
    }
    
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      return;
    }

    // Check if knowledge base is empty
    if (knowledgeBase.length === 0) {
      setChatHistory((prev: Array<{role: 'user' | 'assistant'; content: string; sources?: Array<string | {id: string; name: string; type: string; link?: string;}>; from_documents?: boolean;}>) => [...prev, { 
        role: 'assistant', 
        content: 'Maaf, saya tidak dapat menjawab pertanyaan karena knowledge base Anda masih kosong. Silakan tambahkan dokumen terlebih dahulu dari Google Drive untuk memulai percakapan.' 
      }]);
      setChatMessage('');
      return;
    }
    
    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsChatLoading(true);
    
    // Add user message to chat history
    setChatHistory((prev: Array<{role: 'user' | 'assistant'; content: string; sources?: Array<string | {id: string; name: string; type: string; link?: string;}>; from_documents?: boolean;}>) => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Silent error handling
        
        if (response.status === 401) {
          setMessage('Sesi telah berakhir. Silakan login ulang.');
        } else {
          throw new Error(`Failed to send message: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      // Add assistant response to chat history
      setChatHistory((prev: Array<{role: 'user' | 'assistant'; content: string; sources?: Array<string | {id: string; name: string; type: string; link?: string;}>; from_documents?: boolean;}>) => [...prev, { 
        role: 'assistant', 
        content: formatAIResponse(data.message || 'Tidak ada respons dari AI.'),
        sources: data.sources || [],
        from_documents: data.from_documents || false
      }]);
      
    } catch (error) {
      // Silent error handling
      setChatHistory((prev: Array<{role: 'user' | 'assistant'; content: string; sources?: Array<string | {id: string; name: string; type: string; link?: string;}>; from_documents?: boolean;}>) => [...prev, { 
        role: 'assistant', 
        content: 'Maaf, terjadi kesalahan saat mengirim pesan. Silakan coba lagi.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return null; // Jangan render apa-apa jika belum login
  }

  const greeting = getGreeting();
  
  // Get background class based on time
  const getBackgroundClass = () => {
    return 'min-h-screen bg-gradient-to-br from-white via-red-50/30 to-white relative overflow-hidden';
  };


  return (
    <div className={getBackgroundClass()}>
      {/* Premium Background Pattern */}
      <div className="background-dots"></div>
      
      {/* Dynamic Animated Background Elements */}
      <div className="background-animated">
        <div className="background-blob-1"></div>
        <div className="background-blob-2"></div>
        <div className="background-blob-3"></div>
        <div className="background-blob-4"></div>
      </div>

      
      {/* LARA Navigation Bar - Premium Glass */}
      <nav className="nav-main">
        <div className="nav-container">
          <div className="nav-content">
            {/* Logo & Brand */}
            <div className="nav-brand">
              <div className="nav-logo">
                <div className="nav-logo-icon">
                  <span className="nav-logo-text">L</span>
                </div>
                <div className="nav-logo-dot"></div>
              </div>
              <div>
                <h2 className="nav-title">
                  LARA
                </h2>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="nav-actions">
              {/* User Profile Picture - Glass Effect */}
              <div className="nav-profile">
                <div className="nav-profile-avatar">
                  {user.picture ? (
                    <img 
                      src={user.picture} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-full"
                      loading="eager"
                      decoding="async"
                      onLoad={() => {
                        // Cache the successful image to prevent future 429 errors
                        if (user.picture && user.id) {
                          const cacheKey = `profile_picture_${user.id}`;
                          const cacheData = {
                            url: user.picture,
                            timestamp: Date.now()
                          };
                          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
                        }
                      }}
                      onError={(e) => {
                        setProfilePictureError(true);
                        // Hide the image and show fallback
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="nav-profile-fallback"
                    style={{ display: user.picture ? 'none' : 'flex' }}
                  >
                    <span className="nav-profile-text">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                    {profilePictureError && (
                      <button
                        onClick={retryProfilePicture}
                        className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-75 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
                        title="Retry loading profile picture"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Button with Door Animation */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="nav-logout"
                >
                  {/* Door Frame */}
                  <div className="nav-logout-icon">
                    {/* Door - Opens to the left */}
                    <div className="nav-logout-flame">
                      {/* Door Handle */}
                      <div className="nav-logout-spark"></div>
                      {/* Door Panel Lines */}
                      <div className="nav-logout-line-1"></div>
                      <div className="nav-logout-line-2"></div>
                    </div>
                    
                    {/* Door Opening Effect - Background */}
                    <div className="nav-logout-overlay"></div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="nav-logout-glow"></div>
                  
                  {/* Tooltip */}
                  <div className="nav-tooltip">
                    Logout
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="main-content">
        {/* Header Section - Compact */}
        <div className={`backdrop-blur-2xl rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 lg:p-8 animate-fade-in border border-white/30 relative overflow-hidden ${
          currentTime.getHours() >= 5 && currentTime.getHours() < 12 ? 'bg-gradient-to-br from-pink-500/50 via-pink-400/40 to-pink-200/30' :
          currentTime.getHours() >= 12 && currentTime.getHours() < 15 ? 'bg-gradient-to-br from-yellow-500/50 via-yellow-400/40 to-yellow-200/30' :
          currentTime.getHours() >= 15 && currentTime.getHours() < 18 ? 'bg-gradient-to-br from-orange-500/50 via-orange-400/40 to-orange-200/30' :
          'bg-gradient-to-br from-blue-500/50 via-blue-400/40 to-blue-200/30'
        }`}>
          {/* Animated Background Pattern - Reduced opacity */}
          <div className="absolute inset-0 opacity-2">
            <div className="header-bg-pattern-1"></div>
            <div className="header-bg-pattern-2"></div>
            <div className="header-bg-pattern-3"></div>
          </div>
          
          
          {/* Content - Compact */}
          {/* Mobile Layout */}
          <div className="header-mobile">
            <div className="header-mobile-content">
              {/* Top Row: Greeting + Time */}
              <div className="header-mobile-content">
                <div className="w-full">
                    <h1 className={`mobile-greeting-text ${greeting.color} animate-fade-in drop-shadow-lg tracking-tight`}>
                      {greeting.text}, {user.name || 'Pengguna'}!
                    </h1>
                </div>
                {/* Time - Full width on mobile */}
                <TimeDisplay currentTime={currentTime} greeting={greeting} variant="mobile" />
              </div>
              
              {/* Description */}
              <div className="text-center">
                <div className="description-box-mobile">
                  <p className="description-text-mobile">Kelola dokumen Anda dan mulailah bertanya dengan AI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="header-tablet">
            <div className="header-tablet-content">
              {/* Top Row: Greeting + Time */}
              <div className="header-tablet-content">
                <div className="w-full">
                  <h1 className={`text-2xl font-bold ${greeting.color} animate-fade-in drop-shadow-lg tracking-tight leading-tight`}>
                    {greeting.text}, {user.name || 'Pengguna'}!
                  </h1>
                </div>
                
                {/* Time - Full width on tablet */}
                <TimeDisplay currentTime={currentTime} greeting={greeting} variant="tablet" />
                
                {/* Description */}
                <div className="description-box-tablet">
                  <p className="description-text-tablet">Kelola dokumen Anda dan mulailah bertanya dengan AI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="header-desktop">
            <div className="header-desktop-content">
              {/* Left: Greeting */}
              <div className="flex-1">
                <div className="space-y-4">
                  <h1 className={`text-3xl xl:text-4xl 2xl:text-5xl font-bold ${greeting.color} animate-fade-in drop-shadow-lg tracking-tight leading-tight`}>
                    {greeting.text}, {user.name || 'Pengguna'}!
                  </h1>
                  <div className="description-box-desktop">
                    <p className="description-text-desktop">Kelola dokumen Anda dan mulailah bertanya dengan AI</p>
                  </div>
                </div>
              </div>
              
              {/* Right: Time & Date */}
              <div className="ml-8">
                <TimeDisplay currentTime={currentTime} greeting={greeting} variant="desktop" />
              </div>
            </div>
          </div>
        </div>


        {/* Main Content Grid */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Chat Section - Full Width */}
          <div className="w-full">
            {/* Chat Section */}
            <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-white/40">
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="chat-bg-pattern-1"></div>
                  <div className="chat-bg-pattern-2"></div>
                </div>
                
                <div className="relative z-10">
                  {/* Mobile Layout - Stacked */}
                  <div className="chat-mobile">
                    {/* Top Row - Title and Icon */}
                    <div className="chat-header-mobile">
                      <div className="chat-icon-mobile">
                        <span className="text-white text-xl sm:text-2xl">💬</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="chat-title-mobile">Chat dengan AI</h2>
                        <p className="chat-subtitle-mobile">Tanyakan apapun tentang dokumen Anda</p>
                      </div>
                    </div>
                    
                    {/* Bottom Row - Status and Button */}
                    <div className="chat-status-mobile">
                      <div className="flex-center-wrap gap-2 sm:gap-3">
                        <div className="status-badge">
                          <span className="status-text">
                            {chatHistory.length} pesan
                          </span>
                        </div>
                        {knowledgeBase.length === 0 && (
                          <div className="status-badge-error">
                            <span className="status-text-error">
                              ⚠️ KB Kosong
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={handleChatToggle}
                          className={`chat-button ${chatAnimation}`}
                        >
                          {isChatExpanded ? '📤 Tutup Chat' : '💬 Buka Chat'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tablet Layout - Horizontal */}
                  <div className="chat-tablet">
                    {/* Left Side - Title and Icon */}
                    <div className="chat-header-tablet">
                      <div className="chat-icon-tablet">
                        <span className="text-white text-2xl">💬</span>
                      </div>
                      <div>
                        <h2 className="chat-title-tablet">Chat dengan AI</h2>
                        <p className="chat-subtitle-tablet">Tanyakan apapun tentang dokumen Anda</p>
                      </div>
                    </div>
                    
                    {/* Right Side - Status and Button */}
                    <div className="chat-status-tablet">
                      <div className="chat-status-content-tablet">
                        <div className="status-badge">
                          <span className="status-text">
                            {chatHistory.length} pesan
                          </span>
                        </div>
                        {knowledgeBase.length === 0 && (
                          <div className="status-badge-error">
                            <span className="status-text-error">
                              ⚠️ Knowledge Base Kosong
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={handleChatToggle}
                          className={`chat-button ${chatAnimation}`}
                        >
                          {isChatExpanded ? '📤 Tutup Chat' : '💬 Buka Chat'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout - Horizontal */}
                  <div className="chat-desktop">
                    {/* Left Side - Title and Icon */}
                    <div className="chat-header-desktop">
                      <div className="chat-icon-desktop">
                        <span className="text-white text-3xl">💬</span>
                      </div>
                      <div>
                        <h2 className="chat-title-desktop">Chat dengan AI</h2>
                        <p className="chat-subtitle-desktop">Tanyakan apapun tentang dokumen Anda</p>
                      </div>
                    </div>
                    
                    {/* Right Side - Status and Button */}
                    <div className="chat-status-desktop">
                      <div className="chat-status-content-desktop">
                        <div className="status-badge">
                          <span className="status-text">
                            {chatHistory.length} pesan
                          </span>
                        </div>
                        {knowledgeBase.length === 0 && (
                          <div className="status-badge-error">
                            <span className="status-text-error">
                              ⚠️ Knowledge Base Kosong
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={handleChatToggle}
                          className={`chat-button ${chatAnimation}`}
                        >
                          {isChatExpanded ? '📤 Tutup Chat' : '💬 Buka Chat'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {showChatWindow && (
                <div className={`p-4 sm:p-6 lg:p-8 ${chatWindowAnimation}`}>
                  <div className="h-[450px] sm:h-[550px] bg-white/30 backdrop-blur-xl rounded-3xl overflow-y-auto mb-6 border border-white/40 shadow-xl">
                  <div className="p-4 space-y-4">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl flex-center mx-auto mb-4 animate-float">
                          <span className="text-2xl sm:text-3xl">💬</span>
                        </div>
                        <p className="text-gray-800 font-medium mb-2 text-lg">Mulai bertanya tentang dokumen Anda!</p>
                        <p className="text-sm text-gray-600">AI akan menjawab berdasarkan dokumen di knowledge base</p>
                        {knowledgeBase.length === 0 && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-800">
                              ⚠️ Knowledge base kosong. Tambahkan dokumen terlebih dahulu.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      chatHistory.map((msg: {role: 'user' | 'assistant'; content: string; sources?: Array<string | {id: string; name: string; type: string; link?: string;}>; from_documents?: boolean;}, index: number) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`px-4 py-3 rounded-2xl ${
                            msg.role === 'user' 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white max-w-xs sm:max-w-md lg:max-w-lg shadow-md' 
                              : 'glass-dark text-gray-800 shadow-md w-full max-w-4xl border border-white/20'
                          }`}>
                            <div className="flex items-start space-x-3">
                              <div className={`w-8 h-8 rounded-full flex-center text-sm ${
                                msg.role === 'user' 
                                  ? 'bg-white bg-opacity-20' 
                                  : 'bg-blue-100'
                              }`}>
                                {msg.role === 'user' ? '👤' : '🤖'}
                              </div>
                              <div className="flex-1">
                                {msg.role === 'assistant' ? (
                                  renderFormattedMessage(msg.content)
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                )}
                                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                  <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="font-medium text-gray-800 mb-2">
                                      📚 Sumber Referensi ({msg.sources.length} dokumen):
                                    </p>
                                    <div className="space-y-2">
                                      {msg.sources.map((source: string | {id: string; name: string; type: string; link?: string;}, index: number) => (
                                        <div key={index} className="flex items-center justify-between glass-dark p-3 rounded-lg border border-white/20 shadow-sm">
                                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                              <span className="text-sm">
                                                {typeof source === 'object' && source.type ? getFileIcon(source.type) : '📄'}
                                              </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-gray-900 truncate">
                                                {typeof source === 'string' ? source : source.name || source.id}
                                              </p>
                                              {typeof source === 'object' && source.type && (
                                                <p className="text-gray-500 text-xs mt-1">
                                                  {getFileTypeName(source.type)}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          {typeof source === 'object' && source.link && (
                                            <a 
                                              href={source.link} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="ml-3 text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                                            >
                                              🔗 Buka di Drive
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="glass-dark text-gray-800 px-4 py-3 rounded-xl border border-white/20 shadow-sm w-full max-w-4xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                            <span className="text-sm font-medium">AI sedang berpikir...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={knowledgeBase.length === 0 ? "Tambahkan dokumen terlebih dahulu..." : "Tanyakan sesuatu tentang dokumen Anda..."}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl sm:rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 placeholder-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl text-base sm:text-lg font-medium"
                    disabled={isChatLoading || knowledgeBase.length === 0}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || isChatLoading || knowledgeBase.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl text-base sm:text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:transform-none border border-white/30"
                  >
                    {isChatLoading ? '⏳' : '📤'} Kirim
                  </Button>
                </div>
              </div>
              )}</div>
        </div>

          {/* Message Display - Below Chat */}
          {message && (
            <div className="bg-white/25 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 animate-fade-in">
              <div className="p-3 sm:p-6 lg:p-8">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className={`w-4 h-4 rounded-full animate-pulse shadow-lg ${
                    message.includes('berhasil') || message.includes('dimuat') 
                      ? 'bg-red-400 shadow-red-400/60' 
                      : message.includes('gagal') || message.includes('error')
                      ? 'bg-red-400 shadow-red-400/60'
                      : 'bg-blue-400 shadow-blue-400/60'
                  }`}></div>
                  <p className={`font-semibold text-sm sm:text-lg lg:text-xl ${
                    message.includes('berhasil') || message.includes('dimuat') 
                      ? 'text-red-800' 
                      : message.includes('gagal') || message.includes('error')
                      ? 'text-red-800'
                      : 'text-blue-800'
                  }`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Google Drive and Knowledge Base - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Google Drive Section */}
            <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-white/40">
                <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 px-6 sm:px-8 py-6 sm:py-8 backdrop-blur-sm relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="documents-bg-pattern-1"></div>
                        <div className="documents-bg-pattern-2"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div className="documents-header">
                            <div className="documents-icon">
                                <span className="text-white text-2xl sm:text-3xl">📁</span>
                            </div>
                            <div>
                                <h2 className="documents-title">Google Drive Documents</h2>
                                <p className="documents-subtitle">
                                    {isShowingRecentFiles ? (
                                        <span className="flex items-center space-x-2">
                                            <span>📄</span>
                                            <span>Dokumen Terbaru (Fallback)</span>
                                        </span>
                                    ) : currentFolderName ? (
                                        `📁 ${currentFolderName}`
                                    ) : (
                                        'Kelola dokumen dari Google Drive Anda'
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="documents-actions">
                            {isShowingRecentFiles && (
                                <Button
                                    onClick={() => {
                                        setIsShowingRecentFiles(false);
                                        setFolderUrl('');
                                        fetchDocuments();
                                        fetchKnowledgeBase();
                                    }}
                                    className="documents-button"
                                >
                                    🔄 Kembali ke Normal
                                </Button>
                            )}
                            <Button
                                onClick={() => setShowFolderInput(!showFolderInput)}
                                className="documents-button"
                            >
                                📁 Folder URL
                            </Button>
                            {(currentFolderId || folderHistory.length > 0) && (
                                <Button
                                    onClick={handleBackToParent}
                                    className="documents-button flex items-center space-x-2"
                                >
                                    <span>←</span>
                                    <span>Back</span>
                                </Button>
                            )}
                            <Button
                                onClick={() => {
                                    fetchDocuments();
                                    fetchKnowledgeBase();
                                }}
                                disabled={isLoading}
                                className="documents-button"
                            >
                                {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="documents-content">
                    {/* Folder URL Input */}
                    {showFolderInput && (
                        <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 mb-4 border border-white/50 shadow-lg">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                                        <span className="text-white text-lg">📁</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-800">Akses Folder Google Drive</h3>
                                        <p className="text-sm text-red-600">Masukkan URL folder Google Drive yang sudah di-set public</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                                        <input
                                            type="text"
                                            placeholder="https://drive.google.com/drive/folders/1ABC123..."
                                            value={folderUrl}
                                            onChange={(e) => setFolderUrl(e.target.value)}
                                            className="flex-1 px-4 py-3 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-gray-800 placeholder-gray-600 transition-all duration-300 shadow-lg"
                                        />
                                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                            <Button
                                                onClick={() => {
                                                    if (folderUrl.trim()) {
                                                        fetchAllDocumentsFromFolder(folderUrl.trim());
                                                    } else {
                                                        setMessage('Masukkan URL folder terlebih dahulu.');
                                                    }
                                                }}
                                                disabled={isLoadingFolder || !folderUrl.trim()}
                                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                                            >
                                                {isLoadingFolder ? '⏳ Loading...' : '🔍 Buka Folder'}
                                            </Button>
                                            
                                            <Button
                                                onClick={handleBulkUploadFromFolder}
                                                disabled={isBulkUploading || !folderUrl.trim()}
                                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                                            >
                                                {isBulkUploading ? '⏳ Uploading...' : '📁 Upload Semua File'}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-600 bg-red-50/80 p-3 rounded-xl border border-red-200/50">
                                        <p className="font-medium text-red-800 mb-1">💡 Cara mendapatkan URL folder:</p>
                                        <ol className="list-decimal list-inside space-y-1 text-red-700">
                                            <li>Buka Google Drive di browser</li>
                                            <li>Klik kanan pada folder yang ingin diakses</li>
                                            <li>Pilih "Get link" atau "Dapatkan link"</li>
                                            <li>Set sharing ke "Anyone with the link can view"</li>
                                            <li>Copy URL yang muncul</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bulk Upload Progress */}
                    {isBulkUploading && (
                        <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 mb-4 border border-white/50 shadow-lg">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                                        <span className="text-white text-lg">📁</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-800">Bulk Upload Progress</h3>
                                        <p className="text-sm text-green-600">{bulkUploadStatus}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-700">
                                        <span>Progress: {bulkUploadProgress.current} / {bulkUploadProgress.total}</span>
                                        <span>{bulkUploadProgress.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${bulkUploadProgress.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search and Sort Controls */}
                    <div className="search-controls">
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <div className="search-input-container">
                                <input
                                    type="text"
                                    placeholder="Cari dokumen..."
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                <div className="search-icon">
                                    🔍
                                </div>
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'name' | 'modified' | 'size')}
                                className="px-4 py-3 bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm sm:text-base text-gray-800 transition-all duration-200"
                            >
                                <option value="modified" className="bg-white text-gray-800">📅 Terbaru</option>
                                <option value="name" className="bg-white text-gray-800">🔤 Nama</option>
                                <option value="size" className="bg-white text-gray-800">📏 Ukuran</option>
                            </select>
                        </div>
                        
                        {/* Status Bar */}
                        <div className="flex flex-col space-y-3">
                            {/* File Count and Selection Status */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs sm:text-sm text-gray-700 bg-white/40 backdrop-blur-xl px-3 py-2 rounded-lg border border-white/50">
                                        📁 {filteredAndSortedFolders.length} folder
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-700 bg-white/40 backdrop-blur-xl px-3 py-2 rounded-lg border border-white/50">
                                        📄 {filteredAndSortedDocuments.length} dokumen
                                    </span>
                                </div>
                                
                                {selectedDocs.size > 0 && (
                                    <span className="text-xs sm:text-sm text-red-700 bg-red-100/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-red-200/50">
                                        ✅ {selectedDocs.size} dipilih
                                    </span>
                                )}
                                
                                {isMultiSelectMode && (
                                    <span className="text-xs sm:text-sm text-blue-700 bg-blue-100/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-blue-200/50">
                                        🔄 Multi-select mode
                                    </span>
                                )}
                                
                                {isShowingRecentFiles && (
                                    <span className="text-xs sm:text-sm text-orange-700 bg-orange-100/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-orange-200/50">
                                        📄 Menampilkan dokumen terbaru
                                    </span>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button 
                                  onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                                    isMultiSelectMode 
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                      : 'bg-white/90 hover:bg-white text-gray-800 border border-white/30'
                                  }`}
                                >
                                  {isMultiSelectMode ? '🔘 Multi-select ON' : '☐ Multi-select OFF'}
                                </Button>
                                
                                <Button 
                                  onClick={handleAddToKnowledgeBase} 
                                  disabled={selectedDocs.size === 0}
                                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                                >
                                  ➕ Tambahkan ke KB ({selectedDocs.size})
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="h-[350px] sm:h-[450px] lg:h-[500px] bg-white/30 backdrop-blur-xl rounded-2xl overflow-y-auto border border-white/40 shadow-lg">
                        <div className="p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
                                    <span className="ml-3 text-gray-700 font-medium">Memuat dokumen...</span>
                                </div>
                            ) : (filteredAndSortedFolders.length > 0 || filteredAndSortedDocuments.length > 0) ? (
                                <div className="space-y-3">
                                    {/* Breadcrumb Navigation - New System */}
                                    {(currentFolderId || folderHistory.length > 0) && (
                                        <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 mb-4 border border-white/50 shadow-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Button
                                                        onClick={handleBackToParent}
                                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/30 flex items-center space-x-2"
                                                    >
                                                        <span>←</span>
                                                        <span>Kembali</span>
                                                    </Button>
                                                    <div className="flex items-center space-x-2 text-gray-700">
                                                        <span className="text-lg">📁</span>
                                                        <div className="flex items-center space-x-1">
                                                            <span className="text-sm font-medium">Root</span>
                                                            {folderHistory.map((folder, index) => (
                                                                <div key={index} className="flex items-center space-x-1">
                                                                    <span className="text-gray-400">/</span>
                                                                    <span className="text-sm font-medium text-gray-800">{folder.name}</span>
                                                                </div>
                                                            ))}
                                                            {currentFolderName && (
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-gray-400">/</span>
                                                                    <span className="text-sm font-medium text-red-600">{currentFolderName}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 bg-white/30 px-3 py-1 rounded-lg">
                                                    {filteredAndSortedFolders.length} folder, {filteredAndSortedDocuments.length} dokumen
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Folders Section - Only show when NOT in "all documents" mode */}
                                    {filteredAndSortedFolders.length > 0 && !currentFolderId && (
                                        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50/20 to-orange-50/20 rounded-2xl border-2 border-yellow-200/30">
                                            <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center">
                                                <span className="text-2xl mr-2">📁</span>
                                                Folders ({filteredAndSortedFolders.length})
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {filteredAndSortedFolders.map((folder: Document, index: number) => {
                                                    
                                                    return (
                                                        <div 
                                                            key={folder.id} 
                                                            className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border-2 border-yellow-300/40 hover:border-yellow-400/60 transition-all duration-300 cursor-pointer hover:shadow-lg group"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleFolderClick(folder);
                                                            }}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                                                                    <span className="text-xl">📁</span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-yellow-800 truncate group-hover:text-yellow-900">
                                                                        {folder.name}
                                                                    </p>
                                                                    <p className="text-xs text-yellow-600">
                                                                        Click to open all documents
                                                                    </p>
                                                                    <p className="text-xs text-red-600 font-bold">
                                                                        DEBUG: ID={folder.id}
                                                                    </p>
                                                                </div>
                                                                <div 
                                                                    className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center group-hover:bg-yellow-600 transition-colors duration-200"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleFolderClick(folder);
                                                                    }}
                                                                >
                                                                    <span className="text-white text-sm">→</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Documents Section - Show all documents (no folders) */}
                                    {filteredAndSortedDocuments.filter(doc => !doc.is_folder).length > 0 && (
                                        <div className="p-4 bg-gradient-to-r from-red-50/20 to-pink-50/20 rounded-2xl border-2 border-red-200/30">
                                            <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                                                <span className="text-2xl mr-2">📄</span>
                                                {currentFolderId ? 'All Documents from Folder' : 'Documents'} ({filteredAndSortedDocuments.filter(doc => !doc.is_folder).length})
                                            </h3>
                                            <div className="space-y-3">
                                                {filteredAndSortedDocuments.filter(doc => !doc.is_folder).map((doc: Document, index: number) => (
                                                    <div 
                                                        key={doc.id} 
                                                        className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                                                            selectedDocs.has(doc.id) 
                                                                ? 'bg-red-100/80 border-red-400 shadow-md' 
                                                                : 'bg-white/60 border-red-200/40 hover:border-red-300/60 hover:shadow-md'
                                                        }`}
                                                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                                            if (e.ctrlKey || e.metaKey) {
                                                                handleSelectDoc(doc.id, filteredAndSortedFolders.length + index);
                                                            }
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            id={doc.id}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectDoc(doc.id, filteredAndSortedFolders.length + index)}
                                                            checked={selectedDocs.has(doc.id)}
                                                            className="h-5 w-5 text-red-600 rounded focus:ring-red-500"
                                                            onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                                                        />
                                                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                                                            <span className="text-xl">{getFileIcon(doc.mime_type || doc.mimeType)}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <label htmlFor={doc.id} className="block text-sm font-semibold text-red-800 truncate cursor-pointer">
                                                                {doc.name}
                                                            </label>
                                                             <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-red-600 mt-1">
                                                                 <span className="bg-red-100/80 px-1.5 sm:px-2 py-1 rounded-full border border-red-200/50 text-xs">
                                                                     {getFileTypeName(doc.mime_type || doc.mimeType)}
                                                                 </span>
                                                                 {doc.size && (
                                                                     <span className="bg-red-100/80 px-1.5 sm:px-2 py-1 rounded-full border border-red-200/50 text-xs">
                                                                         {formatFileSize(doc.size)}
                                                                     </span>
                                                                 )}
                                                                 {doc.modified_time && (
                                                                     <span className="bg-red-100/80 px-1.5 sm:px-2 py-1 rounded-full border border-red-200/50 text-xs break-words max-w-full">
                                                                         📅 {formatDate(doc.modified_time)}
                                                                     </span>
                                                                 )}
                                                                 {doc.source_subfolder && (
                                                                     <span className="bg-red-100/80 px-1.5 sm:px-2 py-1 rounded-full border border-red-200/50 text-red-700 text-xs">
                                                                         📁 {doc.source_subfolder}
                                                                     </span>
                                                                 )}
                                                             </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                                        <span className="text-2xl sm:text-3xl">📄</span>
                                    </div>
                                    <p className="text-gray-700 font-medium text-lg">
                                        {searchTerm ? 'Tidak ada dokumen yang cocok dengan pencarian.' : 'Tidak ada dokumen yang ditemukan di Google Drive Anda.'}
                                    </p>
                                    {searchTerm && (
                                        <Button
                                            onClick={() => setSearchTerm('')}
                                            className="mt-4 text-red-600 hover:text-red-700 text-sm font-medium bg-white/90 hover:bg-white border border-white/30 px-4 py-2 rounded-2xl transition-all duration-200 hover:shadow-md"
                                        >
                                            Hapus filter pencarian
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Knowledge Base Section */}
            <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-white/40">
                <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 px-6 sm:px-8 py-6 sm:py-8 backdrop-blur-sm relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="knowledge-bg-pattern-1"></div>
                        <div className="knowledge-bg-pattern-2"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div className="knowledge-header">
                            <div className="knowledge-icon">
                                <span className="text-white text-2xl sm:text-3xl">🧠</span>
                            </div>
                            <div>
                                <h2 className="knowledge-title">Knowledge Base</h2>
                                <p className="knowledge-subtitle">Dokumen yang siap untuk AI</p>
                            </div>
                        </div>
                        <div className="knowledge-actions">
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                <Button
                                    onClick={async () => {
                                        if (!token) return;
                                        try {
                                            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/debug/knowledge-base`, {
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            const data = await response.json();
                                            alert(`Debug Info:\nTotal chunks: ${data.document_count}\nUnique docs: ${data.unique_document_count}\nCollection: ${data.collection_name}`);
                                        } catch (error) {
                                            // Silent error handling
                                        }
                                    }}
                                    className="knowledge-button"
                                >
                                    🔍 Debug
                                </Button>
                                
                                <Button
                                    onClick={handleClearAllDocuments}
                                    disabled={knowledgeBase.length === 0 || isLoading}
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-2 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                                >
                                    {isLoading ? '⏳ Clearing...' : '🗑️ Clear All'}
                                </Button>
                            </div>
                            
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/30">
                                <span className="text-sm text-white font-semibold">
                                    {knowledgeBase.length} dokumen
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="knowledge-content">
                    <div className="knowledge-list">
                        <div className="knowledge-list-content">
                        {knowledgeBase.length > 0 ? (
                                <div className="space-y-3">
                                    {knowledgeBase.map(doc => (
                                        <div key={doc.id} className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-md hover:shadow-lg transition-all duration-300 p-4 hover:border-white/60">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 flex-1 min-w-0">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                                                        <span className="text-lg">{getFileIcon(doc.mime_type)}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 break-words leading-tight">{doc.name}</p>
                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-2">
                                                            <span className="glass-badge px-2 py-1 rounded-full border border-white/20">
                                                                {getFileTypeName(doc.mime_type)}
                                                            </span>
                                                            <span className="bg-red-100/80 backdrop-blur-sm text-red-700 px-2 py-1 rounded-full border border-red-200/50">
                                                                {doc.chunk_count} chunks
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                    <Button 
                                      onClick={() => handleRemoveFromKnowledgeBase(doc.id)}
                                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 text-xs rounded-2xl font-medium transition-all duration-300 shadow-md hover:shadow-lg ml-3 flex-shrink-0 transform hover:scale-105"
                                    >
                                                    🗑️ Hapus
                                    </Button>
                                </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                                        <span className="text-2xl sm:text-3xl">🧠</span>
                                    </div>
                                    <p className="text-gray-700 font-medium mb-2 text-lg">Knowledge base masih kosong</p>
                                    <p className="text-sm text-gray-600">Tambahkan dokumen dari Google Drive untuk memulai</p>
                                </div>
                        )}
                        </div>
                    </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* LARA Footer - Compact with Logo Side by Side */}
        <footer className="footer-main">
          <div className="footer-content">
            <div className="footer-brand-container">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <span className="footer-logo-text">L</span>
                </div>
                <div className="footer-logo-dot"></div>
              </div>
              <div className="footer-brand-text">
                <h3 className="footer-title">LARA</h3>
                <p className="footer-subtitle">Legal Assistant</p>
              </div>
            </div>
            <p className="footer-description">
              Transform your legal documents into an intelligent knowledge base.
            </p>
          </div>
        </footer>
      </div>
  );
}
