document.getElementById('solveBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    status.textContent = 'Extracting problem...';
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url || !tab.url.includes('leetcode.com/problems/')) {
            status.textContent = 'Please open a LeetCode problem page';
            return;
        }
        
        // Ensure content script is injected
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (e) {
            // Script may already be injected, that's ok
            console.log('Content script injection:', e.message);
        }
        
        // Small delay for script to initialize
        await new Promise(r => setTimeout(r, 300));
        
        // Get data via content script
        let problemData;
        try {
            problemData = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
        } catch (e) {
            status.textContent = 'Please refresh the LeetCode page and try again';
            return;
        }
        
        if (!problemData || !problemData.success) {
            status.textContent = 'Error' + (problemData?.error || 'Could not extract data. Refresh page.');
            return;
        }
        
        const { title, description, language, existingCode } = problemData;
        status.textContent = `Solving in ${language}...`;
        
        // Call backend API
        const apiResponse = await fetch(CONFIG.BACKEND_URL + CONFIG.SOLVE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, language, existingCode })
        });
        
        if (!apiResponse.ok) {
            throw new Error(`Server error: ${apiResponse.status}`);
        }
        
        const data = await apiResponse.json();
        
        if (data.solution.startsWith('ERROR:')) {
            status.textContent = 'Error' + data.solution;
            return;
        }
        
        status.textContent = 'Injecting code...';
        
        // Inject code via content script
        const injectResult = await chrome.tabs.sendMessage(tab.id, {
            action: 'injectCode',
            code: data.solution,
            autoRun: true
        });
        
        if (injectResult && injectResult.success) {
            status.textContent = 'Code injected! Running tests... Will auto-retry (up to 3x) if failed, auto-submit if passed!';
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(data.solution);
            status.textContent = 'Caution' + (injectResult?.error || 'Could not inject.') + ' Code copied - paste with Ctrl+V';
        }
        
    } catch (err) {
        console.error('LeetCode AI Error:', err);
        status.textContent = 'Error' + err.message;
    }
});