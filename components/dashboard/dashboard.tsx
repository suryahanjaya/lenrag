'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import '../../styles.css';

// Komponen UI kustom diganti dengan elemen HTML standar untuk memperbaiki error render.
// Jika Anda telah menginstal komponen shadcn/ui, Anda dapat mengembalikan impor asli.

interface Document {
  id: string;
  name: string;
  mime_type?: string;
  mimeType?: string; // Fallback for different API response formats
  created_time?: string;
  modified_time?: string;
  web_view_link?: string;
  size?: string;
  parent_id?: string;
  is_folder?: boolean;
  file_extension?: string;
}

interface KnowledgeBaseDocument {
  id: string;
  name: string;
  mime_type: string;
  chunk_count: number;
}

interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  level?: number;
  children?: Folder[];
}

interface FolderHierarchy {
  folders: Folder[];
  documents: Document[];
  folder_tree: Folder[];
  documents_by_folder: { [key: string]: Document[] };
  folder_map: { [key: string]: Folder };
}

interface User {
  id:string;
  name?: string;
  email?: string;
  picture?: string;
}

interface DashboardProps {
  user: User | null;
  token: string | null;
  onLogout?: () => void;
}

export function Dashboard({ user, token, onLogout }: DashboardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
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
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<Array<{id: string, name: string, parentId?: string}>>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [folderHierarchy, setFolderHierarchy] = useState<FolderHierarchy | null>(null);
  const [folderPath, setFolderPath] = useState<string[]>([]);
  const [chatAnimation, setChatAnimation] = useState<string>('');
  const [chatWindowAnimation, setChatWindowAnimation] = useState<string>('');
  const [showChatWindow, setShowChatWindow] = useState<boolean>(false);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle chat button click with animation
  const handleChatToggle = () => {
    console.log('Chat button clicked, starting animation');
    setChatAnimation('animate-chat-bounce');
    
    if (!isChatExpanded) {
      // Opening chat
      setTimeout(() => {
        setShowChatWindow(true);
        setIsChatExpanded(true);
        setChatWindowAnimation('animate-chat-slide-in');
        setChatAnimation('');
        console.log('Chat window opening animation started');
      }, 300);
    } else {
      // Closing chat
      setChatWindowAnimation('animate-chat-slide-out');
      setTimeout(() => {
        setShowChatWindow(false);
        setIsChatExpanded(false);
        setChatWindowAnimation('');
        setChatAnimation('');
        console.log('Chat window closing animation completed');
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

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format current date for display
  const formatCurrentDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to get file type icon
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType || typeof mimeType !== 'string') return '📄';
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

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Organize documents by folders using real hierarchy
  const organizedContent = useMemo(() => {
    if (!folderHierarchy) {
      return { folders: [], documents: [] };
    }

    // Get current folder's children and documents
    const currentFolderFolders = folderHierarchy.folders.filter((folder: Folder) => 
      folder.parent_id === currentFolder
    );

    const currentFolderDocs = folderHierarchy.documents_by_folder[currentFolder || 'null'] || [];

    return {
      folders: currentFolderFolders,
      documents: currentFolderDocs
    };
  }, [folderHierarchy, currentFolder]);

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

  // Fungsi untuk mengambil dokumen dari Google Drive dengan hierarki folder
  const fetchDocuments = async () => {
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/hierarchy`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Google-Token': token,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        
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
      console.log('Documents hierarchy API response:', data);
      
      // Set folder hierarchy
      setFolderHierarchy(data);
      
      // Set documents (all documents from hierarchy)
      setDocuments(data.documents || []);
      
      // Only show success message if there are documents or folders
      const totalItems = (data.documents?.length || 0) + (data.folders?.length || 0);
      if (totalItems > 0) {
        setMessage(`Berhasil dimuat. ${data.folders?.length || 0} folder dan ${data.documents?.length || 0} dokumen ditemukan.`);
      } else {
        setMessage('Tidak ada dokumen atau folder ditemukan di Google Drive Anda.');
      }

    } catch (error) {
      console.error('Error fetching documents hierarchy:', error);
      setMessage('Gagal memuat dokumen. Periksa koneksi internet dan coba lagi.');
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
        console.log('Knowledge base API response:', data);
        console.log('Documents in knowledge base:', data.documents);
        console.log('Total documents:', data.total_documents);
        console.log('Debug info:', data.debug_info);
        setKnowledgeBase(data.documents || []);
      } else {
        console.error('Failed to fetch knowledge base:', response.status);
        setKnowledgeBase([]);
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      setKnowledgeBase([]);
    }
  };

  // Jalankan fetchDocuments ketika token tersedia
  useEffect(() => {
    // BARIS DEBUGGING: Tampilkan nilai token di konsol browser
    console.log('Dashboard received token:', token);
    
    if (token) {
      fetchDocuments();
      fetchKnowledgeBase();
    } else {
      // Jika tidak ada token, hentikan status memuat dan beri pesan.
      setIsLoading(false);
      setMessage("Token otentikasi tidak ditemukan. Silakan coba login ulang.");
    }
  }, [token]);


  const handleSelectDoc = (docId: string, index?: number) => {
    setSelectedDocs((prev: Set<string>) => {
      const newSelection = new Set(prev);
      
      if (isMultiSelectMode && lastSelectedIndex !== null && index !== undefined) {
        // Range selection (Shift + Click)
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const allItems = [...organizedContent.folders, ...filteredAndSortedDocuments];
        
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

  // Handle folder navigation
  const handleFolderClick = (folderId: string) => {
    if (!folderHierarchy) return;
    
    const folder = folderHierarchy.folder_map[folderId];
    if (folder) {
      setCurrentFolder(folderId);
      setSelectedDocs(new Set()); // Clear selection when navigating
      
      // Update folder path - build path from root to current folder
      const buildPath = (folderId: string): string[] => {
        const folder = folderHierarchy.folder_map[folderId];
        if (!folder || !folder.parent_id) {
          return folder ? [folder.name] : [];
        }
        return [...buildPath(folder.parent_id), folder.name];
      };
      
      setFolderPath(buildPath(folderId));
    }
  };

  // Handle back navigation
  const handleBackToParent = () => {
    if (!folderHierarchy) return;
    
    if (currentFolder) {
      const currentFolderData = folderHierarchy.folder_map[currentFolder];
      if (currentFolderData && currentFolderData.parent_id) {
        setCurrentFolder(currentFolderData.parent_id);
        
        // Update folder path - build path from root to parent folder
        const buildPath = (folderId: string): string[] => {
          const folder = folderHierarchy.folder_map[folderId];
          if (!folder || !folder.parent_id) {
            return folder ? [folder.name] : [];
          }
          return [...buildPath(folder.parent_id), folder.name];
        };
        
        setFolderPath(buildPath(currentFolderData.parent_id));
      } else {
        setCurrentFolder(null);
        setFolderPath([]);
      }
    } else {
      setCurrentFolder(null);
      setFolderPath([]);
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
              console.error('Add documents error:', response.status, errorText);
              throw new Error(`Failed to add documents: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('Add documents result:', result);
          console.log('Processed count:', result.processed_count);
          console.log('Total requested:', result.total_requested);
          setMessage(`Berhasil menambahkan ${result.processed_count || selectedDocs.size} dokumen ke knowledge base!`);
          setSelectedDocs(new Set());
          
          // Refresh data
          fetchDocuments();
          // Add a small delay to ensure the backend has processed the documents
          setTimeout(() => {
            console.log('Refreshing knowledge base after adding documents...');
            fetchKnowledgeBase();
          }, 2000);
          
      } catch (error) {
          console.error('Error adding documents:', error);
          setMessage('Gagal menambahkan dokumen. Periksa koneksi dan coba lagi.');
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
                console.error('Remove document error:', response.status, errorText);
                throw new Error(`Failed to remove document: ${response.status}`);
            }
            
            setMessage('Dokumen berhasil dihapus dari knowledge base!');
            
            // Refresh data
            fetchDocuments();
            fetchKnowledgeBase();
            
        } catch (error) {
            console.error('Error removing document:', error);
            setMessage('Gagal menghapus dokumen. Periksa koneksi dan coba lagi.');
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
        console.error('Chat error:', response.status, errorText);
        
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
        content: data.message || 'Tidak ada respons dari AI.',
        sources: data.sources || [],
        from_documents: data.from_documents || false
      }]);
      
    } catch (error) {
      console.error('Error sending message:', error);
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

  const getTimeBoxClass = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return 'glass-time-morning'; // Pink untuk pagi
    } else if (hour >= 12 && hour < 15) {
      return 'glass-time-noon'; // Kuning untuk siang
    } else if (hour >= 15 && hour < 18) {
      return 'glass-time-afternoon'; // Orange untuk sore
    } else {
      return 'glass-time-evening'; // Biru untuk malam
    }
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
                      className="object-cover"
                    />
                  ) : (
                    <div className="nav-profile-fallback">
                      <span className="nav-profile-text">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
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
                <div className={`${getTimeBoxClass()} time-box-mobile`}>
                  <div className="time-display-mobile">
                    <div className="time-icon-mobile">
                      <span className={`text-lg ${
                        currentTime.getHours() >= 5 && currentTime.getHours() < 12 ? 'text-pink-400' :
                        currentTime.getHours() >= 12 && currentTime.getHours() < 15 ? 'text-yellow-400' :
                        currentTime.getHours() >= 15 && currentTime.getHours() < 18 ? 'text-orange-400' :
                        'text-blue-400'
                      }`}>
                        {greeting.emoji}
                      </span>
                    </div>
                    <span className="time-text-mobile">{formatTime(currentTime)}</span>
                  </div>
                  <div className="date-display-mobile">
                    {formatCurrentDate(currentTime)}
                  </div>
                </div>
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
                <div className={`${getTimeBoxClass()} time-box-tablet`}>
                  <div className="time-display-tablet">
                    <div className="time-icon-tablet">
                      <span className={`text-2xl ${
                        currentTime.getHours() >= 5 && currentTime.getHours() < 12 ? 'text-pink-400' :
                        currentTime.getHours() >= 12 && currentTime.getHours() < 15 ? 'text-yellow-400' :
                        currentTime.getHours() >= 15 && currentTime.getHours() < 18 ? 'text-orange-400' :
                        'text-blue-400'
                      }`}>
                        {greeting.emoji}
                      </span>
                    </div>
                    <span className="time-text-tablet">{formatTime(currentTime)}</span>
                  </div>
                  <div className="date-display-tablet">
                    {formatCurrentDate(currentTime)}
                  </div>
                </div>
                
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
                <div className={`${getTimeBoxClass()} time-box-desktop`}>
                  <div className="time-display-desktop">
                    <div className="time-icon-desktop">
                      <span className={`text-2xl ${
                        currentTime.getHours() >= 5 && currentTime.getHours() < 12 ? 'text-pink-400' :
                        currentTime.getHours() >= 12 && currentTime.getHours() < 15 ? 'text-yellow-400' :
                        currentTime.getHours() >= 15 && currentTime.getHours() < 18 ? 'text-orange-400' :
                        'text-blue-400'
                      }`}>
                        {greeting.emoji}
                      </span>
                    </div>
                    <span className="time-text-desktop">{formatTime(currentTime)}</span>
                  </div>
                  <div className="date-display-desktop">
                    {formatCurrentDate(currentTime)}
                  </div>
                </div>
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
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
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
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full animate-pulse shadow-lg ${
                    message.includes('berhasil') || message.includes('dimuat') 
                      ? 'bg-red-400 shadow-red-400/60' 
                      : message.includes('gagal') || message.includes('error')
                      ? 'bg-red-400 shadow-red-400/60'
                      : 'bg-blue-400 shadow-blue-400/60'
                  }`}></div>
                  <p className={`font-semibold text-xl mobile-small-text ${
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
                                    {currentFolder ? `📁 ${folderPath.length > 0 ? folderPath.join(' / ') : 'Folder'}` : 'Kelola dokumen dari Google Drive Anda'}
                                </p>
                            </div>
                        </div>
                        <div className="documents-actions">
                            {(currentFolder || folderPath.length > 0) && (
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
                                        📁 {organizedContent.folders.length} folder
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-700 bg-white/40 backdrop-blur-xl px-3 py-2 rounded-lg border border-white/50">
                                        📄 {filteredAndSortedDocuments.length} dokumen
                                    </span>
                                    {folderHierarchy && (
                                        <span className="text-xs sm:text-sm text-gray-700 bg-white/40 backdrop-blur-xl px-3 py-2 rounded-lg border border-white/50">
                                            📊 Total: {folderHierarchy.folders.length} folder, {folderHierarchy.documents.length} dokumen
                                        </span>
                                    )}
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
                            ) : (organizedContent.folders.length > 0 || filteredAndSortedDocuments.length > 0) ? (
                                <div className="space-y-3">
                                    {/* Breadcrumb Navigation */}
                                    {(currentFolder || folderPath.length > 0) && (
                                        <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 mb-4 border border-white/50 shadow-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Button
                                                        onClick={handleBackToParent}
                                                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/30 flex items-center space-x-2"
                                                    >
                                                        <span>←</span>
                                                        <span>Kembali</span>
                                                    </Button>
                                                    <div className="flex items-center space-x-2 text-gray-700">
                                                        <span className="text-lg">📁</span>
                                                        <div className="flex items-center space-x-1">
                                                            {folderPath.length > 0 ? (
                                                                <>
                                                                    <span className="text-sm font-medium">Root</span>
                                                                    {folderPath.map((folder, index) => (
                                                                        <div key={index} className="flex items-center space-x-1">
                                                                            <span className="text-gray-400">/</span>
                                                                            <span className="text-sm font-medium text-gray-800">{folder}</span>
                                                                        </div>
                                                                    ))}
                                                                </>
                                                            ) : (
                                                                <span className="text-sm font-medium">Root</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 bg-white/30 px-3 py-1 rounded-lg">
                                                    {organizedContent.folders.length} folder, {filteredAndSortedDocuments.length} dokumen
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Folders */}
                                    {organizedContent.folders.map((folder: Folder, index: number) => (
                                        <div 
                                            key={folder.id} 
                                            className="flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer glass-dark border-white/20 hover:border-white/40 hover:shadow-md"
                                            onClick={() => handleFolderClick(folder.id)}
                                            onKeyDown={(e) => handleKeyDown(e, folder.id, index)}
                                            tabIndex={0}
                                        >
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-md">
                                                <span className="text-xl">📁</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{folder.name}</p>
                                                <p className="text-xs text-gray-600">Folder</p>
                                            </div>
                                            <div className="text-gray-400">
                                                →
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Documents */}
                                    {filteredAndSortedDocuments.map((doc: Document, index: number) => (
                                        <div 
                                            key={doc.id} 
                                            className={`flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                                                selectedDocs.has(doc.id) 
                                                    ? 'glass-premium border-red-400 shadow-md animate-glow' 
                                                    : 'glass-dark border-white/20 hover:border-white/40 hover:shadow-md'
                                            }`}
                                            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                                if (e.ctrlKey || e.metaKey) {
                                                    handleSelectDoc(doc.id, organizedContent.folders.length + index);
                                                }
                                            }}
                                            onKeyDown={(e) => handleKeyDown(e, doc.id, organizedContent.folders.length + index)}
                                            tabIndex={0}
                                        >
                                        <input
                                            type="checkbox"
                                            id={doc.id}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectDoc(doc.id, organizedContent.folders.length + index)}
                                            checked={selectedDocs.has(doc.id)}
                                            className="h-5 w-5 text-red-400 rounded focus:ring-red-400"
                                            onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                                        />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                        <span className="text-xl">{getFileIcon(doc.mime_type || doc.mimeType)}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <label htmlFor={doc.id} className="block text-sm font-semibold text-gray-800 truncate cursor-pointer">
                                            {doc.name}
                                        </label>
                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1">
                                                            <span className="glass-badge px-2 py-1 rounded-full border border-white/20">
                                                                {getFileTypeName(doc.mime_type || doc.mimeType)}
                                                            </span>
                                                            {doc.size && (
                                                                <span className="glass-badge px-2 py-1 rounded-full border border-white/20">
                                                                    {formatFileSize(doc.size)}
                                                                </span>
                                                            )}
                                                            {doc.modified_time && (
                                                                <span className="glass-badge px-2 py-1 rounded-full text-gray-700 border border-white/20">
                                                                    📅 {formatDate(doc.modified_time)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                            <Button
                                onClick={async () => {
                                    if (!token) return;
                                    try {
                                        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/debug/knowledge-base`, {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        const data = await response.json();
                                        console.log('Debug knowledge base:', data);
                                        alert(`Debug Info:\nTotal chunks: ${data.document_count}\nUnique docs: ${data.unique_document_count}\nCollection: ${data.collection_name}`);
                                    } catch (error) {
                                        console.error('Debug error:', error);
                                    }
                                }}
                                className="knowledge-button"
                            >
                                🔍 Debug
                            </Button>
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

        {/* LARA Footer - Simplified */}
        <footer className="bg-gradient-to-br from-blue-900 via-red-800 to-blue-900 text-white relative overflow-hidden mt-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-red-500 to-white rounded-xl flex items-center justify-center border-2 border-white/30">
                    <span className="text-white font-bold text-lg">L</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-red-200 to-blue-200 bg-clip-text text-transparent">
                    LARA Dashboard
                  </h3>
                  <p className="text-gray-300 text-sm font-semibold">Legal And Regulation Assistant</p>
                  <p className="text-gray-400 text-xs font-medium">Created by Surya Hanjaya</p>
                </div>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed max-w-2xl mx-auto">
                Transform your legal documents into an intelligent knowledge base. Ask questions and get answers powered by AI and your own legal documents.
              </p>
            </div>
          </div>
        </footer>
      </div>
  );
}
