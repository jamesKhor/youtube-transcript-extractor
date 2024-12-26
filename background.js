// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Function to inject content script
async function injectContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
        console.log('Content script injected successfully');
    } catch (err) {
        console.error('Failed to inject content script:', err);
        throw err;
    }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTranscript') {
        // Get the active tab and inject content script if needed
        chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
            if (!tabs[0]) {
                sendResponse({error: 'No active tab found'});
                return;
            }
            
            try {
                // Inject content script first
                await injectContentScript(tabs[0].id);
                
                // Now send message to content script
                const response = await chrome.tabs.sendMessage(tabs[0].id, request);
                sendResponse(response);
            } catch (error) {
                sendResponse({error: 'Failed to get transcript: ' + error.message});
            }
        });
        return true; // Will respond asynchronously
    }
}); 