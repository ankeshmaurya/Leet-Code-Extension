// Runs in page context - can access Monaco editor
// Prevent double injection
if (window._leetcodeAIInjected) {
    console.log('LeetCode AI: Injected script already loaded');
} else {
    window._leetcodeAIInjected = true;
    
    window._leetcodeAI = {
        currentAttempt: 0,
        maxAttempts: 3,
        previousErrors: []
    };

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        
        // Extract problem data
        if (event.data.type === 'LEETCODE_AI_EXTRACT') {
            const data = extractProblemData();
            window.postMessage({ type: 'LEETCODE_AI_DATA', payload: data }, '*');
        }
        
        // Inject code
        if (event.data.type === 'LEETCODE_AI_INJECT') {
            // Reset attempts if this is a fresh solve
            if (event.data.isRetry !== true) {
                window._leetcodeAI.currentAttempt = 0;
                window._leetcodeAI.previousErrors = [];
            }
            window._leetcodeAI.currentAttempt++;
            console.log('LeetCode AI: Attempt', window._leetcodeAI.currentAttempt, 'of', window._leetcodeAI.maxAttempts);
            const result = injectCode(event.data.code, event.data.autoRun);
            window.postMessage({ type: 'LEETCODE_AI_INJECT_RESULT', payload: result }, '*');
        }
    });
    
    console.log('LeetCode AI: Injected script ready');
}

function extractProblemData() {
    try {
        // Get title
        let title = document.title.split(' - ')[0].trim();
        const titleEl = document.querySelector('[data-cy="question-title"]')
            || document.querySelector('.text-title-large')
            || document.querySelector('a[class*="text-title-large"]');
        if (titleEl) title = titleEl.innerText.trim();
        
        // Get description
        let description = '';
        const descEl = document.querySelector('[data-cy="question-content"]')
            || document.querySelector('div[class*="elfjS"]')
            || document.querySelector('div[data-track-load="description_content"]');
        if (descEl) description = descEl.innerText;
        
        // Get selected language from the dropdown
        let language = 'Python3';
        
        // Try to find language selector button
        const allButtons = document.querySelectorAll('button');
        const supportedLangs = ['C++', 'Java', 'Python', 'Python3', 'C', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Ruby', 'Swift', 'Kotlin', 'Rust', 'Scala', 'PHP'];
        
        for (const btn of allButtons) {
            const text = btn.textContent.trim();
            // Check if this button contains exactly a language name
            if (supportedLangs.includes(text)) {
                language = text;
                console.log('LeetCode AI: Found language button:', text);
                break;
            }
        }
        
        // Also check for dropdown with id containing headlessui
        const langDropdown = document.querySelector('button[id*="headlessui-listbox-button"]');
        if (langDropdown) {
            const langText = langDropdown.textContent.trim();
            if (langText && langText.length < 15 && supportedLangs.includes(langText)) {
                language = langText;
            }
        }
        
        // Get existing code from Monaco
        let existingCode = '';
        if (window.monaco && window.monaco.editor) {
            try {
                const editors = window.monaco.editor.getEditors();
                if (editors && editors.length > 0) {
                    existingCode = editors[0].getValue();
                }
            } catch (e) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) {
                    existingCode = models[0].getValue();
                }
            }
        }
        
        console.log('LeetCode AI: Extracted -', { title, language, codeLength: existingCode.length });
        return { success: true, title, description, language, existingCode };
        
    } catch (e) {
        console.error('LeetCode AI: Extract error', e);
        return { success: false, error: e.message };
    }
}

function injectCode(code, autoRun) {
    try {
        let injected = false;
        
        if (window.monaco && window.monaco.editor) {
            try {
                const editors = window.monaco.editor.getEditors();
                if (editors && editors.length > 0) {
                    editors[0].setValue(code);
                    injected = true;
                    console.log('LeetCode AI: Code set via getEditors()');
                }
            } catch (e) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) {
                    models[0].setValue(code);
                    injected = true;
                    console.log('LeetCode AI: Code set via getModels()');
                }
            }
        }
        
        if (!injected) {
            console.log('LeetCode AI: Monaco not available:', !!window.monaco);
            return { success: false, error: 'Monaco editor not found' };
        }
        
        console.log('LeetCode AI: Code injected successfully, autoRun =', autoRun);
        
        if (autoRun) {
            console.log('LeetCode AI: Will click Run in 800ms...');
            setTimeout(() => {
                clickRunButton();
            }, 800);
        }
        
        return { success: true };
        
    } catch (e) {
        console.error('LeetCode AI: Inject error', e);
        return { success: false, error: e.message };
    }
}

function clickRunButton() {
    // Find Run button - try multiple selectors
    let runBtn = document.querySelector('[data-e2e-locator="console-run-button"]');
    
    if (!runBtn) {
        runBtn = document.querySelector('button[data-cy="run-code-btn"]');
    }
    
    if (!runBtn) {
        // Look for button with Run text that's not Submit
        const allBtns = document.querySelectorAll('button');
        for (const btn of allBtns) {
            const text = btn.textContent.trim();
            if (text === 'Run' && !btn.disabled) {
                runBtn = btn;
                break;
            }
        }
    }
    
    if (!runBtn) {
        // Try finding by aria-label or class patterns
        runBtn = document.querySelector('button[aria-label*="Run"]');
    }
    
    if (runBtn) {
        console.log('LeetCode AI: Found Run button, clicking...', runBtn);
        runBtn.click();
        startResultWatcher();
    } else {
        console.log('LeetCode AI: Run button not found. Available buttons:');
        document.querySelectorAll('button').forEach(b => console.log(' -', b.textContent.trim().substring(0, 30)));
    }
}

function startResultWatcher() {
    let watchAttempts = 0;
    const watcher = setInterval(() => {
        watchAttempts++;
        const pageText = document.body.innerText;
        
        // Check for test results - look for specific patterns
        const resultArea = document.querySelector('[data-e2e-locator="console-result"]') || 
                          document.querySelector('.result-container') ||
                          document.body;
        const resultText = resultArea.innerText;
        
        // Detect all tests passed (green Accepted without any failures)
        const allPassed = (resultText.includes('Accepted') || resultText.includes('Output')) &&
                         !resultText.includes('Wrong Answer') &&
                         !resultText.includes('Runtime Error') &&
                         !resultText.includes('Compile Error') &&
                         !resultText.includes('Time Limit Exceeded') &&
                         !resultText.includes('Memory Limit');
        
        // Detect failures
        const wrongAnswer = resultText.includes('Wrong Answer');
        const runtimeError = resultText.includes('Runtime Error');
        const compileError = resultText.includes('Compile Error') || resultText.includes('SyntaxError');
        const timeLimit = resultText.includes('Time Limit Exceeded');
        const memoryLimit = resultText.includes('Memory Limit');
        const hasError = wrongAnswer || runtimeError || compileError || timeLimit || memoryLimit;
        
        // Check if we have results (not still running)
        const stillRunning = resultText.includes('Running') || resultText.includes('Pending');
        
        if (!stillRunning && allPassed && !hasError) {
            clearInterval(watcher);
            console.log('LeetCode AI: All tests passed! Auto-submitting...');
            setTimeout(() => clickSubmitButton(), 1500);
        } else if (!stillRunning && hasError) {
            clearInterval(watcher);
            
            // Extract error details
            let errorType = 'Unknown Error';
            let errorDetails = '';
            if (wrongAnswer) {
                errorType = 'Wrong Answer';
                // Try to get expected vs actual
                const expected = resultText.match(/Expected[:\s]*([\s\S]*?)(?:Output|$)/i);
                const actual = resultText.match(/Output[:\s]*([\s\S]*?)(?:Expected|$)/i);
                if (expected) errorDetails += 'Expected: ' + expected[1].trim().substring(0, 100) + '; ';
                if (actual) errorDetails += 'Got: ' + actual[1].trim().substring(0, 100);
            } else if (runtimeError) {
                errorType = 'Runtime Error';
                errorDetails = resultText.substring(0, 200);
            } else if (compileError) {
                errorType = 'Compile Error';
                errorDetails = resultText.substring(0, 300);
            } else if (timeLimit) {
                errorType = 'Time Limit Exceeded';
                errorDetails = 'Need more efficient algorithm';
            } else if (memoryLimit) {
                errorType = 'Memory Limit Exceeded';
                errorDetails = 'Need more memory-efficient solution';
            }
            
            console.log('LeetCode AI: Test failed -', errorType, errorDetails);
            window._leetcodeAI.previousErrors.push({ type: errorType, details: errorDetails });
            
            // Request retry if we have attempts left
            if (window._leetcodeAI.currentAttempt < window._leetcodeAI.maxAttempts) {
                console.log('LeetCode AI: Requesting retry with different approach...');
                window.postMessage({ 
                    type: 'LEETCODE_AI_RETRY_NEEDED',
                    errorType: errorType,
                    errorDetails: errorDetails,
                    attempt: window._leetcodeAI.currentAttempt,
                    previousErrors: window._leetcodeAI.previousErrors
                }, '*');
            } else {
                console.log('LeetCode AI: Max attempts reached. Please review the code manually.');
                window.postMessage({ 
                    type: 'LEETCODE_AI_MAX_ATTEMPTS',
                    errors: window._leetcodeAI.previousErrors
                }, '*');
            }
        } else if (watchAttempts > 45) {
            clearInterval(watcher);
            console.log('LeetCode AI: Timeout waiting for results');
        }
    }, 1000);
}

function clickSubmitButton() {
    let submitBtn = document.querySelector('[data-e2e-locator="console-submit-button"]');
    if (!submitBtn) submitBtn = document.querySelector('button[data-cy="submit-code-btn"]');
    if (!submitBtn) {
        const allBtns = document.querySelectorAll('button');
        for (const btn of allBtns) {
            if (btn.textContent.trim() === 'Submit' && !btn.disabled) {
                submitBtn = btn;
                break;
            }
        }
    }
    if (submitBtn) {
        submitBtn.click();
        console.log('LeetCode AI: Submit clicked!');
    } else {
        console.log('LeetCode AI: Submit button not found');
    }
}
