// API Configuration
// Change this to your Railway deployment URL after deploying

const API_CONFIG = {
    // Production: Your Railway backend URL
    PRODUCTION: 'https://ai-integration-builder-production.up.railway.app',

    // Local development
    LOCAL: 'http://localhost:3000',

    // Current environment
    get BASE_URL() {
        // Auto-detect: if running on localhost, use local backend
        // Otherwise, use production backend
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return this.LOCAL;
        }
        return this.PRODUCTION;
    }
};

// Export for use in app.js
window.API_BASE_URL = API_CONFIG.BASE_URL;
