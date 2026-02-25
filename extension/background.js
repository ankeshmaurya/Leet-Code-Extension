// Forward messages between content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "testResult") {
        // Forward to all extension views (popup)
        chrome.runtime.sendMessage(message).catch(() => {
            // Popup might be closed, ignore error
        });
    }
    return true;
});

console.log('LeetCode AI - Background service worker loaded');