// Notify that content script is loaded
console.log('YouTube Transcript Extractor content script loaded');

// Function to decode HTML entities
function decodeHTMLEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Function to clean transcript text
function cleanTranscriptText(text) {
    return text
        // Decode HTML entities
        .split(' ')
        .map(word => decodeHTMLEntities(word))
        .join(' ')
        // Remove multiple spaces
        .replace(/\s+/g, ' ')
        // Remove special characters that shouldn't be there
        .replace(/[^\w\s.,!?'"()-]/g, '')
        // Ensure proper spacing after punctuation
        .replace(/([.,!?])/g, '$1 ')
        // Fix multiple spaces again
        .replace(/\s+/g, ' ')
        .trim();
}

// Function to extract video ID from URL
function getVideoId(url) {
    try {
        const urlParams = new URLSearchParams(new URL(url).search);
        return urlParams.get('v');
    } catch (error) {
        console.error('Error parsing URL:', error);
        return null;
    }
}

// Function to safely extract JSON from string
function extractJSON(html) {
    try {
        // Look for the script tag containing the player response
        const scriptContent = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/)?.[1];
        if (!scriptContent) {
            console.error('Could not find player response data');
            return null;
        }

        // Parse the player response
        const playerResponse = JSON.parse(scriptContent);
        
        // Extract captions data from the correct path
        const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer;
        if (!captions) {
            console.error('No captions data in player response');
            return null;
        }

        return captions;
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
    }
}

// Function to fetch transcript
async function fetchTranscript(videoId) {
    try {
        // First, we need to get the captions data
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await response.text();
        
        // Find and parse the captions data
        const captionsData = extractJSON(html);
        if (!captionsData) {
            throw new Error('No captions data found for this video');
        }

        const transcriptParts = [];

        // Extract text from captions
        const tracks = captionsData.captionTracks;
        if (!tracks || tracks.length === 0) {
            throw new Error('No captions available for this video');
        }

        // Use the first available track
        const track = tracks[0];
        console.log('Using caption track:', track);

        const trackResponse = await fetch(track.baseUrl);
        const trackXml = await trackResponse.text();
        
        // Parse XML and extract text
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(trackXml, 'text/xml');
        const textElements = xmlDoc.getElementsByTagName('text');
        
        if (textElements.length === 0) {
            throw new Error('No transcript text found');
        }

        for (let element of textElements) {
            const text = cleanTranscriptText(element.textContent);
            if (text) {
                transcriptParts.push(text);
            }
        }

        // Join all parts and do a final cleaning
        return cleanTranscriptText(transcriptParts.join(' '));
    } catch (error) {
        console.error('Error fetching transcript:', error);
        throw error;
    }
}

// Listen for messages from popup/background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);

    if (request.action === 'getTranscript') {
        const videoId = getVideoId(request.url);
        if (!videoId) {
            sendResponse({ error: 'Invalid YouTube URL' });
            return;
        }

        fetchTranscript(videoId)
            .then(transcript => {
                sendResponse({ transcript });
            })
            .catch(error => {
                sendResponse({ error: error.message });
            });

        return true; // Will respond asynchronously
    }
}); 