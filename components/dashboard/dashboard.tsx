'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
}

interface KnowledgeBaseDocument {
  id: string;
  name: string;
  mime_type: string;
  chunk_count: number;
}

interface User {
  id:string;
  name?: string;
  email?: string;
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

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get greeting and background based on time with premium gradients
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return { 
        text: 'Selamat Pagi', 
        emoji: '🌅', 
        color: 'from-pink-400 via-rose-400 to-pink-500', 
        bgColor: 'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100',
        glowColor: 'shadow-pink-200/50',
        backgroundGradient: 'from-pink-100 via-rose-50 to-pink-200',
        accentColors: ['pink-200', 'rose-200', 'pink-300']
      };
    } else if (hour >= 12 && hour < 15) {
      return { 
        text: 'Selamat Siang', 
        emoji: '☀️', 
        color: 'from-red-500 via-red-600 to-red-700', 
        bgColor: 'bg-gradient-to-br from-red-50 via-red-100 to-red-200',
        glowColor: 'shadow-red-200/50',
        backgroundGradient: 'from-red-100 via-red-50 to-red-200',
        accentColors: ['red-200', 'red-300', 'red-400']
      };
    } else if (hour >= 15 && hour < 18) {
      return { 
        text: 'Selamat Sore', 
        emoji: '🌇', 
        color: 'from-orange-400 via-red-500 to-pink-500', 
        bgColor: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50',
        glowColor: 'shadow-orange-200/50',
        backgroundGradient: 'from-orange-100 via-orange-50 to-red-100',
        accentColors: ['orange-200', 'orange-300', 'red-200']
      };
    } else {
      return { 
        text: 'Selamat Malam', 
        emoji: '🌙', 
        color: 'from-blue-600 via-indigo-600 to-purple-600', 
        bgColor: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100',
        glowColor: 'shadow-blue-200/50',
        backgroundGradient: 'from-blue-100 via-indigo-50 to-blue-200',
        accentColors: ['blue-200', 'indigo-200', 'blue-300']
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
    if (mimeType.includes('pdf')) return '📕';
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

  // Organize documents by folders
  const organizedContent = useMemo(() => {
    const currentFolderDocs = documents.filter((doc: Document) => {
      // For now, we'll simulate folder structure based on file extensions or names
      // In a real implementation, this would come from Google Drive API
      if (currentFolder === null) {
        // Root folder - show folders and top-level files
        return !doc.name.includes('/') && !doc.name.includes('\\');
      } else {
        // Specific folder - show files in that folder
        return doc.name.includes(currentFolder);
      }
    });

    // Extract folders from document names (simulate folder structure)
    const extractedFolders = new Set<string>();
    documents.forEach((doc: Document) => {
      const pathParts = doc.name.split('/');
      if (pathParts.length > 1) {
        extractedFolders.add(pathParts[0]);
      }
    });

    const folderList = Array.from(extractedFolders).map(folderName => ({
      id: folderName,
      name: folderName,
      parentId: currentFolder || undefined
    }));

    return {
      folders: folderList,
      documents: currentFolderDocs
    };
  }, [documents, currentFolder]);

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

  // Fungsi untuk mengambil dokumen dari Google Drive
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
      console.log('Documents API response:', data);
      
      // Handle different response formats
      const documents = Array.isArray(data) ? data : (data.documents || []);
      setDocuments(documents);
      
      // Only show success message if there are documents
      if (documents.length > 0) {
        setMessage(`Dokumen berhasil dimuat. ${documents.length} dokumen ditemukan.`);
      } else {
        setMessage('Tidak ada dokumen ditemukan di Google Drive Anda.');
      }

    } catch (error) {
      console.error('Error fetching documents:', error);
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
    setCurrentFolder(folderId);
    setSelectedDocs(new Set()); // Clear selection when navigating
  };

  // Handle back navigation
  const handleBackToParent = () => {
    setCurrentFolder(null);
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
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return 'min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200 relative overflow-hidden';
    } else if (hour >= 12 && hour < 15) {
      return 'min-h-screen bg-gradient-to-br from-red-100 via-red-50 to-red-200 relative overflow-hidden';
    } else if (hour >= 15 && hour < 18) {
      return 'min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-red-100 relative overflow-hidden';
    } else {
      return 'min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-blue-200 relative overflow-hidden';
    }
  };

  return (
    <div className={getBackgroundClass()}>
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[length:24px_24px] opacity-20"></div>
      
      {/* Dynamic Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-100 to-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-12 animate-pulse"></div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.3); }
          50% { box-shadow: 0 0 40px rgba(147, 51, 234, 0.6); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .glass {
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(15px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
        }
        .glass-dark {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(15px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
        }
        .glass-premium {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.15);
        }
      `}} />
      
      <div className="relative z-10 container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className={`${greeting.bgColor} rounded-3xl shadow-xl p-8 md:p-12 animate-fade-in border border-white/30 backdrop-blur-xl relative overflow-hidden`}>
          {/* Emoji Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
            <div className="relative">
              <span className="text-[15rem] sm:text-[20rem] md:text-[25rem] lg:text-[30rem] xl:text-[35rem] 2xl:text-[40rem] select-none block leading-none">
                {greeting.emoji}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="grid grid-cols-1 gap-6">
              {/* Greeting Row */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h1 className={`text-2xl font-bold bg-gradient-to-r ${greeting.color} bg-clip-text text-transparent animate-fade-in drop-shadow-sm`}>
                    {greeting.text}!
                  </h1>
                  <p className="text-lg text-gray-700 font-semibold mt-1">{user.name || 'Pengguna'}</p>
                </div>
                {onLogout && (
                  <Button
                    onClick={onLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-12 h-12 rounded-xl text-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                  >
                    🚪
                  </Button>
                )}
              </div>
              
              {/* Description */}
              <div className="text-center">
                <p className="text-gray-700 text-base font-medium">Kelola dokumen Anda dan mulailah bertanya dengan AI</p>
              </div>
              
              {/* Time & Date */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="text-3xl">🕐</span>
                    <span className="text-3xl font-mono font-bold text-gray-800">{formatTime(currentTime)}</span>
                  </div>
                  <div className="text-base text-gray-600 font-medium">
                    {formatCurrentDate(currentTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden sm:block lg:hidden">
            <div className="grid grid-cols-1 gap-8">
              {/* Top Row: Greeting + Logout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div>
                    <h1 className={`text-3xl font-bold bg-gradient-to-r ${greeting.color} bg-clip-text text-transparent animate-fade-in drop-shadow-sm`}>
                      {greeting.text}, {user.name || 'Pengguna'}!
                    </h1>
                    <p className="text-gray-700 text-lg font-medium mt-2">Kelola dokumen Anda dan mulailah bertanya dengan AI</p>
                  </div>
                </div>
                {onLogout && (
                  <Button
                    onClick={onLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-14 h-14 rounded-2xl text-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                  >
                    🚪
                  </Button>
                )}
              </div>
              
              {/* Time & Date Row */}
              <div className="flex justify-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-4">
                      <span className="text-3xl">🕐</span>
                      <span className="text-3xl font-mono font-bold text-gray-800">{formatTime(currentTime)}</span>
                    </div>
                    <div className="text-base text-gray-600 font-medium">
                      {formatCurrentDate(currentTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-12 gap-8 items-center">
              {/* Left: Greeting */}
              <div className="col-span-7">
                <div className="flex items-center space-x-6">
                  <div>
                    <h1 className={`text-4xl xl:text-5xl 2xl:text-6xl font-bold bg-gradient-to-r ${greeting.color} bg-clip-text text-transparent animate-fade-in drop-shadow-sm`}>
                      {greeting.text}, {user.name || 'Pengguna'}!
                    </h1>
                    <p className="text-gray-700 text-xl font-medium mt-3">Kelola dokumen Anda dan mulailah bertanya dengan AI</p>
                  </div>
                </div>
              </div>
              
              {/* Center: Time & Date */}
              <div className="col-span-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-4">
                      <span className="text-4xl">🕐</span>
                      <span className="text-4xl font-mono font-bold text-gray-800">{formatTime(currentTime)}</span>
                    </div>
                    <div className="text-lg text-gray-600 font-medium">
                      {formatCurrentDate(currentTime)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right: Logout */}
              <div className="col-span-1">
                {onLogout && (
                  <Button
                    onClick={onLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-16 h-16 rounded-2xl text-3xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                  >
                    🚪
                  </Button>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>


        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Chat Section - Full Width */}
          <div className="w-full">
            {/* Chat Section */}
            <div className="glass-premium rounded-3xl shadow-lg overflow-hidden animate-fade-in border border-white/30">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center animate-glow">
                      <span className="text-white text-xl sm:text-2xl">💬</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Chat dengan AI</h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-white glass-dark px-3 py-2 rounded-full font-medium">
                      {chatHistory.length} pesan
                    </span>
                    {knowledgeBase.length === 0 && (
                      <span className="text-xs text-yellow-200 bg-yellow-500 bg-opacity-30 px-3 py-1 rounded-full">
                        ⚠️ Kosong
                      </span>
                    )}
                    <Button
                      onClick={() => setIsChatExpanded(!isChatExpanded)}
                      className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 border border-white/30"
                    >
                      {isChatExpanded ? '📤 Tutup' : '💬 Buka Chat'}
                    </Button>
                  </div>
                </div>
              </div>
              {isChatExpanded && (
                <div className="p-4 sm:p-6">
                  <div className="h-[400px] sm:h-[500px] glass-dark rounded-2xl overflow-y-auto mb-4 border border-white/20">
                  <div className="p-4 space-y-4">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                          <span className="text-2xl sm:text-3xl">💬</span>
                        </div>
                        <p className="text-gray-800 font-medium mb-2 text-lg">Mulai bertanya tentang dokumen Anda!</p>
                        <p className="text-sm text-gray-600">AI akan menjawab berdasarkan dokumen di knowledge base</p>
                        {knowledgeBase.length === 0 && (
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <p className="text-sm text-yellow-800">
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
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
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
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                            <span className="text-sm font-medium">AI sedang berpikir...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={knowledgeBase.length === 0 ? "Tambahkan dokumen terlebih dahulu..." : "Tanyakan sesuatu tentang dokumen Anda..."}
                    className="flex-1 px-4 py-3 glass-dark border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 placeholder-gray-500 transition-all duration-200"
                    disabled={isChatLoading || knowledgeBase.length === 0}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || isChatLoading || knowledgeBase.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                  >
                    {isChatLoading ? '⏳' : '📤'} Kirim
                  </Button>
                </div>
              </div>
              )}</div>
        </div>

          {/* Message Display - Below Chat */}
          {message && (
            <div className="glass-premium rounded-2xl shadow-lg border border-white/30 animate-fade-in">
              <div className="p-4 sm:p-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse shadow-sm ${
                    message.includes('berhasil') || message.includes('dimuat') 
                      ? 'bg-green-400 shadow-green-400/50' 
                      : message.includes('gagal') || message.includes('error')
                      ? 'bg-red-400 shadow-red-400/50'
                      : 'bg-blue-400 shadow-blue-400/50'
                  }`}></div>
                  <p className={`font-medium text-lg ${
                    message.includes('berhasil') || message.includes('dimuat') 
                      ? 'text-green-800' 
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            {/* Google Drive Section */}
            <div className="glass-premium rounded-3xl shadow-lg overflow-hidden animate-fade-in border border-white/30">
                <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-4 sm:px-6 py-4 sm:py-6 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center animate-glow">
                                <span className="text-white text-xl sm:text-2xl">📁</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Google Drive Documents</h2>
                        </div>
                        <Button
                            onClick={() => {
                                fetchDocuments();
                                fetchKnowledgeBase();
                            }}
                            disabled={isLoading}
                            className="bg-white/90 hover:bg-white border border-white/30 disabled:bg-opacity-50 text-gray-800 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-md"
                        >
                            {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
                        </Button>
                    </div>
                </div>
                <div className="p-4 sm:p-6">
                    {/* Search and Sort Controls */}
                    <div className="mb-6 space-y-4">
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Cari dokumen..."
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-3 pl-10 glass-dark border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm text-gray-800 placeholder-gray-500 transition-all duration-200"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    🔍
                                </div>
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'name' | 'modified' | 'size')}
                                className="px-4 py-3 glass-dark border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm text-gray-800 transition-all duration-200"
                            >
                                <option value="modified" className="bg-white text-gray-800">📅 Terbaru</option>
                                <option value="name" className="bg-white text-gray-800">🔤 Nama</option>
                                <option value="size" className="bg-white text-gray-800">📏 Ukuran</option>
                            </select>
                        </div>
                        
                        {/* Status Bar */}
                        <div className="flex flex-col space-y-3">
                            {/* File Count and Selection Status */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700 glass-dark px-3 py-2 rounded-lg border border-white/20">
                                        📁 {organizedContent.folders.length} folder
                                    </span>
                                    <span className="text-sm text-gray-700 glass-dark px-3 py-2 rounded-lg border border-white/20">
                                        📄 {filteredAndSortedDocuments.length} dokumen
                                    </span>
                                </div>
                                
                                {selectedDocs.size > 0 && (
                                    <span className="text-sm text-red-700 bg-red-100/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-red-200/50">
                                        ✅ {selectedDocs.size} dipilih
                                    </span>
                                )}
                                
                                {isMultiSelectMode && (
                                    <span className="text-sm text-blue-700 bg-blue-100/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-blue-200/50">
                                        🔄 Multi-select mode (Tab untuk pilih, Esc untuk keluar)
                                    </span>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
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
                                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                                >
                                  ➕ Tambahkan ke Knowledge Base ({selectedDocs.size})
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="h-[400px] sm:h-[500px] glass-dark rounded-2xl overflow-y-auto border border-white/20">
                        <div className="p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
                                    <span className="ml-3 text-gray-700 font-medium">Memuat dokumen...</span>
                                </div>
                            ) : (organizedContent.folders.length > 0 || filteredAndSortedDocuments.length > 0) ? (
                                <div className="space-y-3">
                                    {/* Breadcrumb Navigation */}
                                    {currentFolder && (
                                        <div className="flex items-center space-x-2 mb-4">
                                            <Button
                                                onClick={handleBackToParent}
                                                className="bg-white/90 hover:bg-white text-gray-800 px-3 py-2 rounded-2xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg border border-white/30"
                                            >
                                                ← Kembali
                                            </Button>
                                            <span className="text-gray-600">/ {currentFolder}</span>
                                        </div>
                                    )}
                                    
                                    {/* Folders */}
                                    {organizedContent.folders.map((folder: {id: string; name: string; parentId?: string | null}, index: number) => (
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
                                                            <span className="glass-dark px-2 py-1 rounded-full border border-white/20">
                                                                {getFileTypeName(doc.mime_type || doc.mimeType)}
                                                            </span>
                                                            {doc.size && (
                                                                <span className="glass-dark px-2 py-1 rounded-full border border-white/20">
                                                                    {formatFileSize(doc.size)}
                                                                </span>
                                                            )}
                                                            {doc.modified_time && (
                                                                <span className="glass-dark px-2 py-1 rounded-full text-gray-700 border border-white/20">
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
            <div className="glass-premium rounded-3xl shadow-lg overflow-hidden animate-fade-in border border-white/30">
                <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 px-4 sm:px-6 py-4 sm:py-6 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center animate-glow">
                                <span className="text-white text-xl sm:text-2xl">🧠</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Knowledge Base</h2>
                        </div>
                        <div className="flex items-center space-x-2">
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
                                className="bg-white/90 hover:bg-white border border-white/30 text-gray-800 px-3 py-2 rounded-2xl text-xs font-medium transition-all duration-300 transform hover:scale-105 shadow-md"
                            >
                                🔍 Debug
                            </Button>
                            <span className="text-sm text-gray-700 glass-dark px-3 py-2 rounded-full font-medium border border-white/20">
                                {knowledgeBase.length} dokumen
                            </span>
                        </div>
                    </div>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="h-[400px] sm:h-[500px] glass-dark rounded-2xl overflow-y-auto border border-white/20">
                        <div className="p-4">
                        {knowledgeBase.length > 0 ? (
                                <div className="space-y-3">
                                    {knowledgeBase.map(doc => (
                                        <div key={doc.id} className="glass-dark rounded-2xl border border-white/20 shadow-md hover:shadow-lg transition-all duration-300 p-4 hover:border-white/40">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 flex-1 min-w-0">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                                                        <span className="text-lg">{getFileIcon(doc.mime_type)}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 break-words leading-tight">{doc.name}</p>
                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-2">
                                                            <span className="glass-dark px-2 py-1 rounded-full border border-white/20">
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
    </div>
  );
}
