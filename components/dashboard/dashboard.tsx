'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User, Document, KnowledgeBaseDocument } from '@/lib/types';
import { formatAIResponse } from '@/lib/utils/formatting';
import { Sidebar } from './sidebar';
import { ChatPage } from './chat-page';
import { DocumentsPage } from './documents-page';
import '../../styles.css';

interface DashboardProps {
  user: User | null;
  onLogout?: () => void;
}

function Dashboard({ user, onLogout }: DashboardProps) {
  // View state
  const [currentView, setCurrentView] = useState<'chat' | 'documents'>('chat');

  // Documents and Knowledge Base
  const [documents, setDocuments] = useState<Document[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Chat state
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

  // Chat Sessions Management
  interface ChatSession {
    id: string;
    title: string;
    messages: typeof chatHistory;
    createdAt: number;
    updatedAt: number;
  }

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Document management state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('modified');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [folderUrl, setFolderUrl] = useState<string>('');
  const [isLoadingFolder, setIsLoadingFolder] = useState<boolean>(false);
  const [showFolderInput, setShowFolderInput] = useState<boolean>(false);
  const [isShowingRecentFiles, setIsShowingRecentFiles] = useState<boolean>(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('');
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string, name: string }>>([]);
  const [bulkUploadProgress, setBulkUploadProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadStatus, setBulkUploadStatus] = useState('');

  // Time state for navbar
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('google_token') || localStorage.getItem('access_token') || '';
  };

  // Helper function for error messages
  const setErrorMessage = (errorType: 'folder' | 'documents' | 'add' | 'remove' | 'general') => {
    const messages = {
      folder: 'DORA: Gagal memuat dokumen dari folder. Periksa URL folder dan coba lagi.',
      documents: 'DORA: Gagal memuat dokumen. Periksa koneksi internet dan coba lagi.',
      add: 'DORA: Gagal menambahkan dokumen. Periksa koneksi dan coba lagi.',
      remove: 'DORA: Gagal menghapus dokumen. Periksa koneksi dan coba lagi.',
      general: 'DORA: Terjadi kesalahan. Silakan coba lagi.'
    };
    setMessage(messages[errorType]);
  };

  // Fetch documents from Google Drive
  const fetchDocuments = async () => {
    const token = getToken();
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage('Memuat 50 dokumen terbaru dari Google Drive...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'X-Google-Token': getToken(),
        },
      });

      if (!response.ok) {
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
      setDocuments(data || []);
      setCurrentFolderId(null);
      setCurrentFolderName('');
      setFolderHistory([]);
      setIsShowingRecentFiles(false);

      if (data && data.length > 0) {
        setMessage(`Berhasil dimuat ${data.length} dokumen terbaru dari Google Drive Anda.`);
      } else {
        setMessage('Tidak ada dokumen ditemukan di Google Drive Anda.');
      }
    } catch (error) {
      setErrorMessage('documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch knowledge base
  const fetchKnowledgeBase = async () => {
    const token = getToken();
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
        setKnowledgeBase([]);
      }
    } catch (error) {
      setKnowledgeBase([]);
    }
  };

  // Fetch all documents from folder (including subfolders)
  const fetchAllDocumentsFromFolder = async (url: string) => {
    const token = getToken();
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      setIsLoadingFolder(false);
      return;
    }

    setIsLoadingFolder(true);
    setMessage('');
    setDocuments([]); // Clear existing documents

    try {
      const requestBody = { folder_url: url };

      // 🚀 TRY STREAMING FIRST
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/from-folder-all-stream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'X-Google-Token': getToken(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Streaming failed: ${response.status}`);
        }

        // Check if streaming is supported
        if (!response.body) {
          throw new Error('Streaming not supported by browser');
        }

        // 🚀 PROGRESSIVE LOADING: Read stream and update UI incrementally
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let allDocuments: any[] = [];
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // Decode chunk
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                // Check if done
                if (data.done) {
                  setMessage(`Berhasil memuat ${data.total} dokumen dari folder dan subfolder.`);
                  break;
                }

                // Check for error
                if (data.error) {
                  console.error('Streaming error:', data.error);
                  throw new Error(data.error);
                }

                // Add documents progressively (data is array of documents)
                if (Array.isArray(data)) {
                  allDocuments = [...allDocuments, ...data];

                  // 🚀 UPDATE UI IMMEDIATELY - PROGRESSIVE LOADING!
                  setDocuments([...allDocuments]);

                  // Update message with current count
                  setMessage(`⚡ Loading... ${allDocuments.length} dokumen ditemukan`);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }

        // Final update
        setCurrentFolderId(null);
        setCurrentFolderName('');
        setFolderHistory([]);

        if (allDocuments.length === 0) {
          setMessage('Tidak ada dokumen ditemukan di folder tersebut.');
        }

        return; // Success! Exit function

      } catch (streamError) {
        // Streaming failed, fallback to non-streaming
        console.warn('⚠️ Streaming failed, falling back to non-streaming:', streamError);
        setMessage('⚠️ Streaming tidak tersedia, menggunakan mode standard...');
      }

      // 🔄 FALLBACK: Use non-streaming endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/from-folder-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'X-Google-Token': getToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
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
      setDocuments(data || []);
      setCurrentFolderId(null);
      setCurrentFolderName('');
      setFolderHistory([]);

      if (data && data.length > 0) {
        setMessage(`Berhasil memuat ${data.length} dokumen dari folder dan subfolder.`);
      } else {
        setMessage('Tidak ada dokumen ditemukan di folder tersebut.');
      }

    } catch (error) {
      console.error('❌ Error:', error);
      setMessage('Error saat memuat dokumen. Silakan coba lagi.');
    } finally {
      setIsLoadingFolder(false);
    }
  };

  // Handle document selection
  const handleSelectDoc = (docId: string, index?: number) => {
    setSelectedDocs((prev: Set<string>) => {
      const newSelection = new Set(prev);

      if (isMultiSelectMode && lastSelectedIndex !== null && index !== undefined) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const folders = documents.filter((doc: Document) => doc.is_folder);
        const docs = documents.filter((doc: Document) => !doc.is_folder);
        const allItems = [...folders, ...docs];

        for (let i = start; i <= end; i++) {
          if (allItems[i] && 'id' in allItems[i]) {
            newSelection.add(allItems[i].id);
          }
        }
      } else {
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

  // Handle folder click
  const handleFolderClick = (folder: Document) => {
    if (!folder.web_view_link) {
      setMessage('Folder tidak memiliki link yang valid.');
      return;
    }

    setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);
    setSelectedDocs(new Set());
    fetchAllDocumentsFromFolder(folder.web_view_link);
  };

  // Handle back to parent
  const handleBackToParent = () => {
    if (folderHistory.length > 0) {
      const newHistory = [...folderHistory];
      newHistory.pop();

      if (newHistory.length > 0) {
        const prevFolder = newHistory[newHistory.length - 1];
        setFolderHistory(newHistory);
        setCurrentFolderId(prevFolder.id);
        setCurrentFolderName(prevFolder.name);
        const folderUrl = `https://drive.google.com/drive/folders/${prevFolder.id}`;
        fetchAllDocumentsFromFolder(folderUrl);
      } else {
        setFolderHistory([]);
        setCurrentFolderId(null);
        setCurrentFolderName('');
        fetchDocuments();
      }
    } else if (folderUrl) {
      fetchAllDocumentsFromFolder(folderUrl);
    } else {
      fetchDocuments();
    }

    setSelectedDocs(new Set());
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

  // Add documents to knowledge base
  const handleAddToKnowledgeBase = async () => {
    if (selectedDocs.size === 0) {
      setMessage('Pilih setidaknya satu dokumen.');
      return;
    }

    const token = getToken();
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
          'Authorization': `Bearer ${getToken()}`,
          'X-Google-Token': getToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_ids: Array.from(selectedDocs) }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add documents: ${response.status}`);
      }

      const result = await response.json();
      setMessage(`Berhasil menambahkan ${result.processed_count || selectedDocs.size} dokumen ke knowledge base!`);
      setSelectedDocs(new Set());

      setTimeout(() => {
        fetchKnowledgeBase();
      }, 2000);
    } catch (error) {
      setErrorMessage('add');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove document from knowledge base
  const handleRemoveFromKnowledgeBase = async (docId: string) => {
    const token = getToken();
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      return;
    }

    setMessage('Menghapus dokumen...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/remove/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to remove document: ${response.status}`);
      }

      setMessage('Dokumen berhasil dihapus dari knowledge base!');
      setTimeout(() => {
        fetchKnowledgeBase();
      }, 1000);
    } catch (error) {
      setErrorMessage('remove');
    }
  };

  // Clear all documents from knowledge base
  const handleClearAllDocuments = async () => {
    const token = getToken();
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      return;
    }

    if (knowledgeBase.length === 0) {
      setMessage('Knowledge base sudah kosong.');
      return;
    }

    const confirmed = confirm(`Apakah Anda yakin ingin RESET LLM DATA? Ini akan menghapus semua ${knowledgeBase.length} dokumen dan LLM tidak akan bisa menjawab pertanyaan apapun. Tindakan ini tidak dapat dibatalkan.`);

    if (!confirmed) {
      return;
    }

    const documentsCount = knowledgeBase.length;
    setMessage('Resetting LLM data...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/knowledge-base/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to clear knowledge base: ${response.status}`);
      }

      setMessage(`Berhasil menghapus ${documentsCount} dokumen dari knowledge base!`);
      setTimeout(() => {
        fetchKnowledgeBase();
      }, 1000);
    } catch (error) {
      setMessage('Gagal menghapus dokumen. Periksa koneksi dan coba lagi.');
    }
  };

  // Bulk upload from folder
  const handleBulkUploadFromFolder = async () => {
    if (!folderUrl.trim()) {
      setMessage('Masukkan URL folder terlebih dahulu.');
      return;
    }

    const token = getToken();
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      return;
    }

    setIsBulkUploading(true);
    setBulkUploadProgress({ current: 0, total: 0, percentage: 0 });
    setBulkUploadStatus('Memindai folder...');

    try {
      const requestBody = { folder_url: folderUrl.trim() };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/from-folder-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'X-Google-Token': getToken(),
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

      let processedCount = 0;
      let failedFiles = [];

      for (let i = 0; i < supportedFiles.length; i++) {
        const file = supportedFiles[i];
        setBulkUploadStatus(`Memproses file ${i + 1}/${supportedFiles.length}: ${file.name}`);

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/add`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'X-Google-Token': getToken(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ document_ids: [file.id] }),
          });

          if (response.ok) {
            processedCount++;
          } else {
            const errorText = await response.text();
            failedFiles.push({ name: file.name, error: `${response.status}: ${errorText}` });
          }

          const percentage = Math.round(((i + 1) / supportedFiles.length) * 100);
          setBulkUploadProgress({
            current: i + 1,
            total: supportedFiles.length,
            percentage
          });

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          failedFiles.push({ name: file.name, error: error instanceof Error ? error.message : String(error) });
        }
      }

      if (failedFiles.length > 0) {
        setMessage(`Bulk upload selesai! ${processedCount} berhasil, ${failedFiles.length} gagal.`);
      }

      setBulkUploadStatus('Upload selesai! Memuat ulang data...');
      setMessage(`Bulk upload selesai! ${processedCount} dari ${supportedFiles.length} dokumen berhasil diupload.`);

      setTimeout(() => {
        fetchKnowledgeBase();
      }, 2000);
    } catch (error) {
      setMessage('Gagal melakukan bulk upload. Periksa koneksi dan coba lagi.');
    } finally {
      setIsBulkUploading(false);
      setBulkUploadStatus('');
    }
  };

  // Send chat message
  const handleSendMessage = useCallback(async () => {
    if (!chatMessage.trim() || isChatLoading || knowledgeBase.length === 0) {
      return;
    }

    const token = getToken();
    if (!token) {
      setMessage('Token tidak tersedia. Silakan login ulang.');
      return;
    }

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsChatLoading(true);

    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);

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
        if (response.status === 401) {
          setMessage('Sesi telah berakhir. Silakan login ulang.');
        } else {
          throw new Error(`Failed to send message: ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      setChatHistory((prev) => [...prev, {
        role: 'assistant',
        content: formatAIResponse(data.message || 'Tidak ada respons dari AI.'),
        sources: data.sources || [],
        from_documents: data.from_documents || false
      }]);
    } catch (error) {
      setChatHistory((prev) => [...prev, {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan saat mengirim pesan. Silakan coba lagi.'
      }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatMessage, knowledgeBase.length, isChatLoading]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    const savedActiveId = localStorage.getItem('activeChatId');

    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions);
        setChatSessions(sessions);

        if (savedActiveId && sessions.find((s: ChatSession) => s.id === savedActiveId)) {
          setActiveChatId(savedActiveId);
          const activeSession = sessions.find((s: ChatSession) => s.id === savedActiveId);
          if (activeSession) {
            setChatHistory(activeSession.messages);
          }
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      }
    }
  }, []);

  // Save current chat to session whenever chatHistory changes
  useEffect(() => {
    if (activeChatId && chatHistory.length > 0) {
      setChatSessions(prev => {
        const updated = prev.map(session => {
          if (session.id === activeChatId) {
            // Generate title from first user message
            const firstUserMsg = chatHistory.find(m => m.role === 'user');
            const title = firstUserMsg
              ? firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
              : 'New Chat';

            return {
              ...session,
              title,
              messages: chatHistory,
              updatedAt: Date.now()
            };
          }
          return session;
        });

        localStorage.setItem('chatSessions', JSON.stringify(updated));
        return updated;
      });
    }
  }, [chatHistory, activeChatId]);

  // Create new chat session
  const handleNewChat = () => {
    // Save current chat if it has messages
    if (activeChatId && chatHistory.length > 0) {
      // Already saved by useEffect above
    }

    // Create new session
    const newSession: ChatSession = {
      id: `chat_${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setChatSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem('chatSessions', JSON.stringify(updated));
      return updated;
    });

    setActiveChatId(newSession.id);
    localStorage.setItem('activeChatId', newSession.id);
    setChatHistory([]);
    setChatMessage('');
    setCurrentView('chat');
  };

  // Switch to a different chat session
  const handleSwitchChat = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setActiveChatId(sessionId);
      localStorage.setItem('activeChatId', sessionId);
      setChatHistory(session.messages);
      setChatMessage('');
      setCurrentView('chat');
    }
  };

  // Delete a chat session
  const handleDeleteChat = (sessionId: string) => {
    setChatSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      localStorage.setItem('chatSessions', JSON.stringify(updated));

      // If deleting active chat, switch to another or create new
      if (sessionId === activeChatId) {
        if (updated.length > 0) {
          setActiveChatId(updated[0].id);
          localStorage.setItem('activeChatId', updated[0].id);
          setChatHistory(updated[0].messages);
        } else {
          setActiveChatId(null);
          localStorage.removeItem('activeChatId');
          setChatHistory([]);
        }
      }

      return updated;
    });
  };

  // Initial data fetch
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchDocuments();
      fetchKnowledgeBase();
    } else {
      setIsLoading(false);
      setMessage("Token otentikasi tidak ditemukan. Silakan coba login ulang.");
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        chatHistory={chatHistory}
        onNewChat={handleNewChat}
        currentView={currentView}
        onViewChange={setCurrentView}
        chatSessions={chatSessions}
        activeChatId={activeChatId}
        onSwitchChat={handleSwitchChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar - Broken White Gradient */}
        <nav className="bg-gradient-to-r from-gray-50 via-slate-50 to-stone-50 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Greeting - Only show when chat started */}
            {chatHistory.length > 0 && (
              <div className="flex items-center gap-4">
                <img src="/1T.png" alt="DORA" className="h-10 w-10" />
                {user && (
                  <div>
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const hour = currentTime.getHours();
                        if (hour >= 5 && hour < 12) return 'Good Morning';
                        if (hour >= 12 && hour < 15) return 'Good Afternoon';
                        if (hour >= 15 && hour < 18) return 'Good Evening';
                        return 'Good Night';
                      })()},
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {user.name}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spacer when no chat */}
            {chatHistory.length === 0 && <div></div>}

            {/* Right: Time | Date | Profile | Logout */}
            <div className="flex items-center gap-4">
              {/* Time with Seconds | Date */}
              <div className="flex items-center gap-3 text-sm">
                <span className="font-mono font-semibold text-gray-900">
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">
                  {currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Profile Picture */}
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  className="w-9 h-9 rounded-full border-2 border-gray-200"
                  onError={(e) => {
                    // Fallback to initials avatar if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              {/* Fallback Avatar with Initials */}
              <div
                className="w-9 h-9 rounded-full border-2 border-gray-200 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm"
                style={{ display: user.picture ? 'none' : 'flex' }}
              >
                {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </div>

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-gray-200 hover:border-red-200"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Content Area */}
        {currentView === 'chat' ? (
          <ChatPage
            user={user}
            chatHistory={chatHistory}
            chatMessage={chatMessage}
            isChatLoading={isChatLoading}
            knowledgeBaseCount={knowledgeBase.length}
            onSendMessage={handleSendMessage}
            onChatMessageChange={setChatMessage}
            onKeyPress={handleKeyPress}
          />
        ) : (
          <DocumentsPage
            documents={documents}
            knowledgeBase={knowledgeBase}
            selectedDocs={selectedDocs}
            isLoading={isLoading}
            message={message}
            searchTerm={searchTerm}
            sortBy={sortBy}
            isMultiSelectMode={isMultiSelectMode}
            folderUrl={folderUrl}
            isLoadingFolder={isLoadingFolder}
            showFolderInput={showFolderInput}
            isShowingRecentFiles={isShowingRecentFiles}
            currentFolderId={currentFolderId}
            currentFolderName={currentFolderName}
            folderHistory={folderHistory}
            isBulkUploading={isBulkUploading}
            bulkUploadProgress={bulkUploadProgress}
            bulkUploadStatus={bulkUploadStatus}
            onSelectDoc={handleSelectDoc}
            onFolderClick={handleFolderClick}
            onBackToParent={handleBackToParent}
            onKeyDown={handleKeyDown}
            onAddToKnowledgeBase={handleAddToKnowledgeBase}
            onRemoveFromKnowledgeBase={handleRemoveFromKnowledgeBase}
            onClearAllDocuments={handleClearAllDocuments}
            onBulkUploadFromFolder={handleBulkUploadFromFolder}
            fetchDocuments={fetchDocuments}
            fetchKnowledgeBase={fetchKnowledgeBase}
            fetchAllDocumentsFromFolder={fetchAllDocumentsFromFolder}
            setSearchTerm={setSearchTerm}
            setSortBy={setSortBy}
            setIsMultiSelectMode={setIsMultiSelectMode}
            setFolderUrl={setFolderUrl}
            setShowFolderInput={setShowFolderInput}
            setIsShowingRecentFiles={setIsShowingRecentFiles}
            setMessage={setMessage}
          />
        )}
      </div>
    </div>
  );
}

export { Dashboard };
