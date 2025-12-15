// CANCEL UPLOAD FUNCTIONALITY - ADD TO dashboard.tsx

// 1. ADD THIS FUNCTION after handleRemoveFromKnowledgeBase (around line 590):

  // Cancel upload
  const handleCancelUpload = () => {
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
      uploadAbortController.current = null;
      
      setIsBulkUploading(false);
      setIsLoading(false);
      setBulkUploadStatus('');
      setBulkUploadProgress({ current: 0, total: 0, percentage: 0 });
      setMessage('❌ Upload dibatalkan oleh user');
      
      console.log('🛑 Upload cancelled by user');
    }
  };

// 2. UPDATE handleAddToKnowledgeBase - ADD signal to fetch (line 571):

    // Create abort controller
    uploadAbortController.current = new AbortController();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'X-Google-Token': getToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_ids: Array.from(selectedDocs) }),
        signal: uploadAbortController.current.signal  // ADD THIS LINE
      });

// 3. UPDATE handleBulkUploadFromFolder - ADD signal to fetch (line 673):

    // Create abort controller
    uploadAbortController.current = new AbortController();

    try {
      const requestBody = { folder_url: folderUrl.trim() };

      // 🚀 USE STREAMING ENDPOINT FOR PROGRESSIVE UPDATES!
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/bulk-upload-from-folder-stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'X-Google-Token': getToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: uploadAbortController.current.signal  // ADD THIS LINE
      });

// 4. ADD CANCEL BUTTON IN UI - In DocumentsPage component, find the upload progress section and add:

{isBulkUploading && (
  <button
    onClick={handleCancelUpload}
    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
  >
    ❌ Cancel Upload
  </button>
)}

// 5. HANDLE AbortError in catch blocks:

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Upload cancelled');
        return; // Don't show error message for user cancellation
      }
      console.error('Bulk upload error:', error);
      setMessage('Gagal melakukan bulk upload. Periksa koneksi dan coba lagi.');
      setIsBulkUploading(false);
      setBulkUploadStatus('');
    }
