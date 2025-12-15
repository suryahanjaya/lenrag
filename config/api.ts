/**
 * API Configuration
 * Centralized API URL configuration with fallback
 */

// Get API URL from environment variable with fallback
export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:8000';

// Get Google Client ID from environment variable
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
    console.log('API Configuration:', {
        API_URL,
        GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing'
    });
}

export default {
    API_URL,
    GOOGLE_CLIENT_ID
};
