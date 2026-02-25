// Prevent double injection - wrap everything in guard
if (!window.leetcodeAIContentLoaded) {
    window.leetcodeAIContentLoaded = true;
    
    // Configuration - Use local backend during development
    const BACKEND_URL = 'http://127.0.0.1:8000';
    // Inject helper script into page context to access Monaco
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
    
    // Store problem data for retries
    window._leetcodeAIStoredData = null;
    
    // Listen for messages from page (injected.js)
    window.addEventListener('message', async (event) => {
        if (event.source !== window) return;
        
        // Handle retry request from injected.js
        if (event.data.type === 'LEETCODE_AI_RETRY_NEEDED') {
            console.log('LeetCode AI: Retry requested -', event.data.errorType);
            
            if (!window._leetcodeAIStoredData) {
                console.log('LeetCode AI: No stored problem data for retry');
                return;
            }
            
            try {
                // Build error context for better retry
                const errorContext = event.data.previousErrors.map((e, i) => 
                    `Attempt ${i+1}: ${e.type} - ${e.details}`
                ).join('\n');
                
                const retryDescription = window._leetcodeAIStoredData.description + 
                    '\n\n--- PREVIOUS ATTEMPTS FAILED ---\n' + errorContext +
                    '\n\nIMPORTANT: The previous solution failed. Please provide a DIFFERENT approach/algorithm. ' +
                    'If it was Wrong Answer, check edge cases. If Time Limit, use a more efficient algorithm (e.g., O(n) instead of O(n²)). ' +
                    'If Runtime Error, handle null/empty cases.';
                
                console.log('LeetCode AI: Calling API for retry...');
                
                const response = await fetch(BACKEND_URL + '/solve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: window._leetcodeAIStoredData.title,
                        description: retryDescription,
                        language: window._leetcodeAIStoredData.language,
                        existingCode: window._leetcodeAIStoredData.existingCode
                    })
                });
                
                if (!response.ok) {
                    console.log('LeetCode AI: Retry API failed');
                    return;
                }
                
                const data = await response.json();
                
                if (data.solution && !data.solution.startsWith('ERROR:')) {
                    console.log('LeetCode AI: Got new solution, injecting...');
                    window.postMessage({ 
                        type: 'LEETCODE_AI_INJECT', 
                        code: data.solution,
                        autoRun: true,
                        isRetry: true
                    }, '*');
                }
            } catch (err) {
                console.error('LeetCode AI: Retry error', err);
            }
        }
        
        // Handle max attempts reached
        if (event.data.type === 'LEETCODE_AI_MAX_ATTEMPTS') {
            console.log('LeetCode AI: Max retry attempts reached. Errors:', event.data.errors);
            alert('LeetCode AI: Could not solve after 3 attempts. Please review the code manually.');
        }
    });
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'extractData') {
            window.postMessage({ type: 'LEETCODE_AI_EXTRACT' }, '*');
            
            const handler = (event) => {
                if (event.data && event.data.type === 'LEETCODE_AI_DATA') {
                    window.removeEventListener('message', handler);
                    // Store for retries
                    window._leetcodeAIStoredData = event.data.payload;
                    sendResponse(event.data.payload);
                }
            };
            window.addEventListener('message', handler);
            
            setTimeout(() => {
                window.removeEventListener('message', handler);
                sendResponse({ error: 'Timeout' });
            }, 5000);
            
            return true;
        }
        
        if (message.action === 'injectCode') {
            window.postMessage({ 
                type: 'LEETCODE_AI_INJECT', 
                code: message.code,
                autoRun: message.autoRun,
                isRetry: false
            }, '*');
            
            const handler = (event) => {
                if (event.data && event.data.type === 'LEETCODE_AI_INJECT_RESULT') {
                    window.removeEventListener('message', handler);
                    sendResponse(event.data.payload);
                }
            };
            window.addEventListener('message', handler);
            
            setTimeout(() => {
                window.removeEventListener('message', handler);
                sendResponse({ success: false, error: 'Timeout' });
            }, 5000);
            
            return true;
        }
    });
    
    console.log('LeetCode AI: Content script loaded');
}