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

// Function to make Ollama API request
async function makeOllamaRequest(endpoint, method, body) {
    const url = `http://localhost:11434${endpoint}`;
    
    console.log('Making Ollama request:', {
        url,
        method,
        body: typeof body === 'string' ? JSON.parse(body) : body
    });

    try {
        const response = await fetch(url, {
            method: method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ollama API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                request: { url, method, body }
            });
            throw new Error(`Ollama API error (${response.status} ${response.statusText}): ${errorText}`);
        }

        const responseData = await response.json();
        console.log('Ollama API response:', responseData);
        return responseData;
    } catch (error) {
        console.error('Request failed:', error);
        throw error;
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

    // Handle Ollama API requests
    if (request.action === 'ollamaApi') {
        makeOllamaRequest(request.endpoint, request.method, request.body)
            .then(response => {
                if (request.endpoint === '/api/tags') {
                    sendResponse({ data: { models: response.models || [] } });
                } else if (request.endpoint === '/api/generate') {
                    // Pass the entire response data
                    sendResponse({ 
                        data: response
                    });
                } else {
                    sendResponse({ data: response });
                }
            })
            .catch(error => {
                console.error('Ollama API error:', error);
                sendResponse({ error: error.message });
            });

        return true; // Will respond asynchronously
    }
}); 