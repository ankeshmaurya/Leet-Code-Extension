// Configuration for LeetCode AI Solver Extension
// Backend URL for local development or your own server
const CONFIG = {
    // Use your backend URL (e.g., http://127.0.0.1:8000 or your own server)
    BACKEND_URL: 'http://127.0.0.1:8000',
    
    // API endpoints
    SOLVE_ENDPOINT: '/solve',
    
    // Retry settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
