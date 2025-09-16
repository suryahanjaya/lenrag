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
        color: 'text-white', 
        bgColor: 'from-pink-500 via-pink-600 to-pink-700', 
        glowColor: 'shadow-pink-200/50',
        backgroundGradient: 'from-pink-200 via-yellow-200 to-yellow-300',
        accentColors: ['pink-200', 'yellow-200', 'yellow-300']
      };
    } else if (hour >= 12 && hour < 15) {
      return { 
        text: 'Selamat Siang', 
        emoji: '☀️', 
        color: 'text-white', 
        bgColor: 'from-yellow-500 via-yellow-600 to-yellow-700', 
        glowColor: 'shadow-red-200/50',
        backgroundGradient: 'from-yellow-200 via-orange-200 to-orange-300',
        accentColors: ['yellow-200', 'orange-200', 'orange-300']
      };
    } else if (hour >= 15 && hour < 18) {
      return { 
        text: 'Selamat Sore', 
        emoji: '🌇', 
        color: 'text-white', 
        bgColor: 'from-orange-500 via-orange-600 to-blue-600', 
        glowColor: 'shadow-orange-200/50',
        backgroundGradient: 'from-orange-200 via-blue-200 to-blue-300',
        accentColors: ['orange-200', 'blue-200', 'blue-300']
      };
    } else {
      return { 
        text: 'Selamat Malam', 
        emoji: '🌙', 
        color: 'text-white', 
        bgColor: 'from-blue-500 via-blue-600 to-blue-700', 
        glowColor: 'shadow-blue-200/50',
        backgroundGradient: 'from-blue-200 via-indigo-300 to-purple-400',
        accentColors: ['blue-200', 'indigo-300', 'purple-400']
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
      
      {/* LARA Navigation Bar - Premium Glass */}
      <nav className="bg-gradient-to-r from-blue-500/20 via-red-500/20 to-blue-500/20 backdrop-blur-3xl border-b border-white/30 sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-red-500 to-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 border border-white/40">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-blue-500 rounded-full animate-pulse border border-white"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-red-500 to-blue-800 bg-clip-text text-transparent">
                  LARA
                </h2>
                <p className="text-xs text-gray-600 font-medium">Legal Assistant</p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              {/* User Profile - Glass Effect */}
              <div className="hidden sm:flex items-center space-x-3 bg-gradient-to-r from-blue-500/10 via-red-500/10 to-blue-500/10 backdrop-blur-xl rounded-xl px-3 py-2 border border-white/20">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user.name || 'Pengguna'}</p>
                </div>
              </div>

              {/* Logout Button with Door Animation */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="group relative w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 border border-white/30 overflow-hidden"
                >
                  {/* Door Frame */}
                  <div className="absolute inset-1.5 bg-gray-800 rounded-lg flex items-center justify-center">
                    {/* Door - Opens to the left */}
                    <div className="w-6 h-8 bg-gradient-to-b from-amber-600 to-amber-700 rounded-sm relative group-hover:translate-x-[-6px] group-hover:rotate-[-12deg] transition-all duration-500 origin-left">
                      {/* Door Handle */}
                      <div className="absolute right-1 top-1/2 w-1 h-1 bg-yellow-400 rounded-full transform -translate-y-1/2"></div>
                      {/* Door Panel Lines */}
                      <div className="absolute left-1 top-2 w-0.5 h-4 bg-amber-800"></div>
                      <div className="absolute left-1 top-6 w-0.5 h-2 bg-amber-800"></div>
                    </div>
                    
                    {/* Door Opening Effect - Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Logout
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header Section - Compact */}
        <div className={`bg-gradient-to-br ${greeting.bgColor} bg-opacity-20 backdrop-blur-2xl rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 lg:p-8 animate-fade-in border border-white/30 relative overflow-hidden`}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.3)_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          </div>
          
          {/* Floating Emoji Background - Smaller */}
          <div className="absolute inset-0 flex items-center justify-center opacity-6 pointer-events-none">
            <div className="relative">
              <span className="text-[4rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] xl:text-[8rem] 2xl:text-[9rem] select-none block leading-none animate-float">
                {greeting.emoji}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full blur-2xl animate-pulse"></div>
            </div>
          </div>
          
          {/* Content - Compact */}
          <div className="relative z-10 bg-white/25 backdrop-blur-2xl rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/40 shadow-xl">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="space-y-4">
              {/* Top Row: Greeting + Time */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className={`text-xl font-bold ${greeting.color} animate-fade-in drop-shadow-lg tracking-tight`}>
                    {greeting.text}, {user.name || 'Pengguna'}!
                  </h1>
                </div>
                {/* Time - Moved to the right */}
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-3 border border-white/50 shadow-xl">
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-6 h-6 bg-white/50 rounded-full flex items-center justify-center">
                        <span className="text-sm">🕐</span>
                      </div>
                      <span className="text-lg font-mono font-bold text-gray-800">{formatTime(currentTime)}</span>
                    </div>
                    <div className="text-xs text-gray-700 font-medium bg-white/30 px-2 py-1 rounded-lg">
                      {formatCurrentDate(currentTime)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="text-center">
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-4 border border-white/50 shadow-lg">
                  <p className="text-gray-800 text-lg font-semibold drop-shadow-sm">Kelola dokumen Anda dan mulailah bertanya dengan AI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden sm:block lg:hidden">
            <div className="space-y-6">
              {/* Top Row: Greeting + Time */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="space-y-3">
                    <h1 className={`text-2xl font-bold ${greeting.color} animate-fade-in drop-shadow-lg tracking-tight`}>
                      {greeting.text}, {user.name || 'Pengguna'}!
                    </h1>
                    <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-4 border border-white/50 shadow-lg max-w-2xl">
                      <p className="text-gray-800 text-xl font-semibold drop-shadow-sm">Kelola dokumen Anda dan mulailah bertanya dengan AI</p>
                    </div>
                  </div>
                </div>
                {/* Time - Moved to the right */}
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-xl">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center">
                        <span className="text-xl">🕐</span>
                      </div>
                      <span className="text-2xl font-mono font-bold text-gray-800">{formatTime(currentTime)}</span>
                    </div>
                    <div className="text-sm text-gray-700 font-medium bg-white/30 px-4 py-2 rounded-xl">
                      {formatCurrentDate(currentTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between">
              {/* Left: Greeting */}
              <div className="flex-1">
                <div className="space-y-4">
                  <h1 className={`text-3xl xl:text-4xl 2xl:text-5xl font-bold ${greeting.color} animate-fade-in drop-shadow-lg tracking-tight leading-tight`}>
                    {greeting.text}, {user.name || 'Pengguna'}!
                  </h1>
                  <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/50 shadow-lg max-w-3xl">
                    <p className="text-gray-800 text-xl font-semibold drop-shadow-sm">Kelola dokumen Anda dan mulailah bertanya dengan AI</p>
                  </div>
                </div>
              </div>
              
              {/* Right: Time & Date */}
              <div className="ml-8">
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🕐</span>
                      </div>
                      <span className="text-3xl font-mono font-bold text-gray-800">{formatTime(currentTime)}</span>
                    </div>
                    <div className="text-sm text-gray-700 font-medium bg-white/30 px-4 py-2 rounded-xl">
                      {formatCurrentDate(currentTime)}
                    </div>
                  </div>
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
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.3)_0%,transparent_50%)]"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
                </div>
                
                <div className="relative z-10">
                  {/* Mobile Layout - Stacked */}
                  <div className="block lg:hidden">
                    {/* Top Row - Title and Icon */}
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center animate-glow border border-white/30 flex-shrink-0">
                        <span className="text-white text-xl sm:text-2xl">💬</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg truncate">Chat dengan AI</h2>
                        <p className="text-blue-100 text-xs sm:text-sm font-medium truncate">Tanyakan apapun tentang dokumen Anda</p>
                      </div>
                    </div>
                    
                    {/* Bottom Row - Status and Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl sm:rounded-2xl border border-white/30">
                          <span className="text-xs sm:text-sm text-white font-semibold">
                            {chatHistory.length} pesan
                          </span>
                        </div>
                        {knowledgeBase.length === 0 && (
                          <div className="bg-yellow-500/30 backdrop-blur-sm px-3 py-2 rounded-xl sm:rounded-2xl border border-yellow-400/50">
                            <span className="text-xs text-yellow-100 font-medium">
                              ⚠️ KB Kosong
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => setIsChatExpanded(!isChatExpanded)}
                        className="bg-white/90 hover:bg-white text-gray-800 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/40 w-full sm:w-auto"
                      >
                        {isChatExpanded ? '📤 Tutup Chat' : '💬 Buka Chat'}
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout - Horizontal */}
                  <div className="hidden lg:flex items-center justify-between">
                    {/* Left Side - Title and Icon */}
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-3xl flex items-center justify-center animate-glow border border-white/30 flex-shrink-0">
                        <span className="text-white text-3xl">💬</span>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white drop-shadow-lg">Chat dengan AI</h2>
                        <p className="text-blue-100 text-sm font-medium">Tanyakan apapun tentang dokumen Anda</p>
                      </div>
                    </div>
                    
                    {/* Right Side - Status and Button */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/30">
                          <span className="text-sm text-white font-semibold">
                            {chatHistory.length} pesan
                          </span>
                        </div>
                        {knowledgeBase.length === 0 && (
                          <div className="bg-yellow-500/30 backdrop-blur-sm px-4 py-2 rounded-2xl border border-yellow-400/50">
                            <span className="text-sm text-yellow-100 font-medium">
                              ⚠️ Knowledge Base Kosong
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => setIsChatExpanded(!isChatExpanded)}
                        className="bg-white/90 hover:bg-white text-gray-800 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/40"
                      >
                        {isChatExpanded ? '📤 Tutup Chat' : '💬 Buka Chat'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {isChatExpanded && (
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="h-[450px] sm:h-[550px] bg-white/30 backdrop-blur-xl rounded-3xl overflow-y-auto mb-6 border border-white/40 shadow-xl">
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
                      ? 'bg-green-400 shadow-green-400/60' 
                      : message.includes('gagal') || message.includes('error')
                      ? 'bg-red-400 shadow-red-400/60'
                      : 'bg-blue-400 shadow-blue-400/60'
                  }`}></div>
                  <p className={`font-semibold text-xl ${
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Google Drive Section */}
            <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-white/40">
                <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 px-6 sm:px-8 py-6 sm:py-8 backdrop-blur-sm relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.3)_0%,transparent_50%)]"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/25 backdrop-blur-sm rounded-3xl flex items-center justify-center animate-glow border border-white/30">
                                <span className="text-white text-2xl sm:text-3xl">📁</span>
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Google Drive Documents</h2>
                                <p className="text-red-100 text-sm font-medium">
                                    {currentFolder ? `📁 ${folderPath.length > 0 ? folderPath.join(' / ') : 'Folder'}` : 'Kelola dokumen dari Google Drive Anda'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {(currentFolder || folderPath.length > 0) && (
                                <Button
                                    onClick={handleBackToParent}
                                    className="bg-white/90 hover:bg-white border border-white/40 text-gray-800 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
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
                                className="bg-white/90 hover:bg-white border border-white/40 disabled:bg-opacity-50 text-gray-800 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="p-4 sm:p-6 lg:p-8">
                    {/* Search and Sort Controls */}
                    <div className="mb-6 space-y-4">
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Cari dokumen..."
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-3 pl-10 bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm sm:text-base text-gray-800 placeholder-gray-600 transition-all duration-200"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
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
            <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-white/40">
                <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 px-6 sm:px-8 py-6 sm:py-8 backdrop-blur-sm relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.3)_0%,transparent_50%)]"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/25 backdrop-blur-sm rounded-3xl flex items-center justify-center animate-glow border border-white/30">
                                <span className="text-white text-2xl sm:text-3xl">🧠</span>
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Knowledge Base</h2>
                                <p className="text-red-100 text-sm font-medium">Dokumen yang siap untuk AI</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
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
                                className="bg-white/90 hover:bg-white border border-white/40 text-gray-800 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                <div className="p-4 sm:p-6 lg:p-8">
                    <div className="h-[350px] sm:h-[450px] lg:h-[500px] bg-white/30 backdrop-blur-xl rounded-2xl overflow-y-auto border border-white/40 shadow-lg">
                        <div className="p-4">
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

        {/* LARA Footer */}
        <footer className="bg-gradient-to-br from-blue-900 via-red-800 to-blue-900 text-white relative overflow-hidden mt-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.3)_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {/* Brand Section */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative group">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-red-500 to-white rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 border-2 border-white/30">
                      <span className="text-white font-bold text-2xl">L</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-blue-500 rounded-full animate-pulse border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-red-200 to-blue-200 bg-clip-text text-transparent">
                      LARA Dashboard
                    </h3>
                    <p className="text-gray-300 text-sm font-semibold">Legal And Regulation Assistant</p>
                    <p className="text-gray-400 text-xs font-medium">Created by Surya Hanjaya</p>
                  </div>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed max-w-md mb-6">
                  Transform your legal documents into an intelligent knowledge base. Ask questions and get answers powered by AI and your own legal documents.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/20">
                    <span className="text-xl">📧</span>
                  </a>
                  <a href="#" className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/20">
                    <span className="text-xl">🐦</span>
                  </a>
                  <a href="#" className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/20">
                    <span className="text-xl">💬</span>
                  </a>
                </div>
              </div>
              
              {/* Features */}
              <div>
                <h4 className="text-lg font-bold text-white mb-6 flex items-center">
                  <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-red-500 rounded-full mr-3"></span>
                  Legal Features
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300 text-sm hover:text-white transition-colors cursor-pointer">
                    <span className="w-1 h-1 bg-blue-400 rounded-full mr-3"></span>
                    Legal Document Analysis
                  </li>
                  <li className="flex items-center text-gray-300 text-sm hover:text-white transition-colors cursor-pointer">
                    <span className="w-1 h-1 bg-red-400 rounded-full mr-3"></span>
                    Regulation Compliance
                  </li>
                  <li className="flex items-center text-gray-300 text-sm hover:text-white transition-colors cursor-pointer">
                    <span className="w-1 h-1 bg-white rounded-full mr-3"></span>
                    AI Legal Assistant
                  </li>
                  <li className="flex items-center text-gray-300 text-sm hover:text-white transition-colors cursor-pointer">
                    <span className="w-1 h-1 bg-blue-300 rounded-full mr-3"></span>
                    Real-time Legal Chat
                  </li>
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h4 className="text-lg font-bold text-white mb-6 flex items-center">
                  <span className="w-2 h-2 bg-gradient-to-r from-red-400 to-white rounded-full mr-3"></span>
                  Support
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300 text-sm hover:text-white transition-colors cursor-pointer">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full mr-3"></span>
                    Legal Help Center
                  </li>
                  <li className="flex items-center text-gray-300 text-sm hover:text-white transition-colors cursor-pointer">
                    <span className="w-1 h-1 bg-orange-400 rounded-full mr-3"></span>
                    Legal Documentation
                  </li>
                  <li className="flex items-center text-gray-300 text-sm hover:text-white transition-colors cursor-pointer">
                    <span className="w-1 h-1 bg-red-400 rounded-full mr-3"></span>
                    Contact Legal Support
                  </li>
                  <li className="flex items-center text-gray-300 text-sm hover:text-white transition-colors cursor-pointer">
                    <span className="w-1 h-1 bg-blue-400 rounded-full mr-3"></span>
                    System Status
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className="border-t border-white/20 pt-8">
              <div className="flex justify-center">
                <div className="flex space-x-8">
                  <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors duration-300 hover:scale-105 transform font-medium">Privacy Policy</a>
                  <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors duration-300 hover:scale-105 transform font-medium">Terms of Service</a>
                  <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors duration-300 hover:scale-105 transform font-medium">Legal Notice</a>
                  <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors duration-300 hover:scale-105 transform font-medium">Security</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}
