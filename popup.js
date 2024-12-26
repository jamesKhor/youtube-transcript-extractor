document.addEventListener('DOMContentLoaded', function() {
    const videoUrlInput = document.getElementById('videoUrl');
    const getTranscriptButton = document.getElementById('getTranscript');
    const transcriptDiv = document.getElementById('transcript');
    const copyButton = document.getElementById('copyTranscript');
    const summarizeButton = document.getElementById('summarize');

    // Get current tab's URL when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com/watch')) {
            videoUrlInput.value = tabs[0].url;
        }
    });

    getTranscriptButton.addEventListener('click', async () => {
        const url = videoUrlInput.value;
        if (!url) {
            transcriptDiv.textContent = 'Please enter a YouTube URL';
            return;
        }

        if (!url.includes('youtube.com/watch')) {
            transcriptDiv.textContent = 'Please enter a valid YouTube video URL';
            return;
        }

        transcriptDiv.textContent = 'Loading transcript...';
        
        // Send message to background script
        chrome.runtime.sendMessage({
            action: 'getTranscript',
            url: url
        }, response => {
            if (chrome.runtime.lastError) {
                transcriptDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
                return;
            }

            if (response.error) {
                transcriptDiv.textContent = 'Error: ' + response.error;
            } else if (response.transcript) {
                transcriptDiv.textContent = response.transcript;
            } else {
                transcriptDiv.textContent = 'Could not find transcript';
            }
        });
    });

    copyButton.addEventListener('click', () => {
        const text = transcriptDiv.textContent;
        if (text && text !== 'Loading transcript...' && !text.startsWith('Error:')) {
            navigator.clipboard.writeText(text).then(() => {
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 2000);
            });
        }
    });

    summarizeButton.addEventListener('click', async () => {
        const text = transcriptDiv.textContent;
        if (!text || text === 'Loading transcript...' || text.startsWith('Error:')) {
            transcriptDiv.textContent = 'No valid transcript to summarize';
            return;
        }

        try {
            // Here you would typically send the transcript to your AI service
            // For now, we'll just show a placeholder message
            transcriptDiv.textContent = 'AI summarization will be implemented here';
        } catch (error) {
            transcriptDiv.textContent = 'Error during summarization: ' + error.message;
        }
    });
}); 