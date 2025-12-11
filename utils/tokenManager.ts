// Token Management Utility
// Handles automatic token refresh and persistence

const TOKEN_EXPIRY_KEY = 'token_expiry';
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'google_token';
const REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

export class TokenManager {
    private static refreshTimer: NodeJS.Timeout | null = null;

    /**
     * Save tokens after login
     */
    static saveTokens(accessToken: string, refreshToken: string | null, expiresIn: number = 3600) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }

        // Calculate expiry time (current time + expires_in - buffer)
        const expiryTime = Date.now() + (expiresIn * 1000) - REFRESH_BUFFER;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

        // Start auto-refresh timer
        this.startAutoRefresh();
    }

    /**
     * Get current access token
     */
    static getAccessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    /**
     * Get refresh token
     */
    static getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    /**
     * Check if token is expired or about to expire
     */
    static isTokenExpired(): boolean {
        const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
        if (!expiryTime) return true;

        return Date.now() >= parseInt(expiryTime);
    }

    /**
     * Refresh access token using refresh token
     */
    static async refreshAccessToken(): Promise<boolean> {
        try {
            const refreshToken = this.getRefreshToken();

            if (!refreshToken) {
                console.warn('No refresh token available');
                return false;
            }

            console.log('Refreshing access token...');

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                console.error('Token refresh failed:', response.status);
                this.clearTokens();
                return false;
            }

            const data = await response.json();

            // Save new access token (refresh token stays the same)
            this.saveTokens(data.access_token, refreshToken, data.expires_in);

            console.log('Access token refreshed successfully');
            return true;
        } catch (error) {
            console.error('Error refreshing token:', error);
            this.clearTokens();
            return false;
        }
    }

    /**
     * Start automatic token refresh
     */
    static startAutoRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
        if (!expiryTime) return;

        const timeUntilRefresh = parseInt(expiryTime) - Date.now();

        if (timeUntilRefresh > 0) {
            console.log(`Token will auto-refresh in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);

            this.refreshTimer = setTimeout(async () => {
                const success = await this.refreshAccessToken();
                if (success) {
                    // Schedule next refresh
                    this.startAutoRefresh();
                } else {
                    // Redirect to login if refresh fails
                    window.location.href = '/';
                }
            }, timeUntilRefresh);
        } else {
            // Token already expired, refresh immediately
            this.refreshAccessToken();
        }
    }

    /**
     * Clear all tokens
     */
    static clearTokens() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        localStorage.removeItem('access_token'); // Also clear old key

        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        // Also clear all cookies
        this.clearAllCookies();
    }

    /**
     * Clear all cookies
     */
    static clearAllCookies() {
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
    }

    /**
     * Initialize token manager (call on app start)
     */
    static initialize() {
        // Check if we have tokens
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();

        if (accessToken && refreshToken) {
            // Check if token is expired
            if (this.isTokenExpired()) {
                console.log('Token expired, refreshing...');
                this.refreshAccessToken();
            } else {
                // Start auto-refresh timer
                this.startAutoRefresh();
            }
        }
    }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
    TokenManager.initialize();
}
