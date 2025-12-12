import { useState, useEffect } from 'react';

interface UploadState {
    isUploading: boolean;
    progress: {
        current: number;
        total: number;
        percentage: number;
    };
    status: string;
    startTime: number;
    folderUrl: string;
}

const UPLOAD_STATE_KEY = 'bulk_upload_state';

export const useUploadPersistence = () => {
    const [uploadState, setUploadState] = useState<UploadState | null>(null);

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem(UPLOAD_STATE_KEY);
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                // Only restore if upload was in progress less than 10 minutes ago
                const elapsed = Date.now() - state.startTime;
                if (state.isUploading && elapsed < 10 * 60 * 1000) {
                    setUploadState(state);
                } else {
                    // Clear old state
                    localStorage.removeItem(UPLOAD_STATE_KEY);
                }
            } catch (error) {
                console.error('Error loading upload state:', error);
                localStorage.removeItem(UPLOAD_STATE_KEY);
            }
        }
    }, []);

    // Save state to localStorage
    const saveUploadState = (state: UploadState) => {
        try {
            localStorage.setItem(UPLOAD_STATE_KEY, JSON.stringify(state));
            setUploadState(state);
        } catch (error) {
            console.error('Error saving upload state:', error);
        }
    };

    // Clear state
    const clearUploadState = () => {
        localStorage.removeItem(UPLOAD_STATE_KEY);
        setUploadState(null);
    };

    return {
        uploadState,
        saveUploadState,
        clearUploadState,
    };
};
