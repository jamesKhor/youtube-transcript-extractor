document.addEventListener('DOMContentLoaded', async () => {
    const generateButton = document.getElementById('generateSummary');
    const visualizeButton = document.getElementById('visualizeButton');
    const summaryTextArea = document.getElementById('summary');
    const mermaidOutput = document.getElementById('mermaidOutput');
    const modelSelect = document.getElementById('modelSelect');
    const videoUrlInput = document.getElementById('videoUrl');
    const summarySection = document.getElementById('summarySection');
    const mermaidSection = document.getElementById('mermaidSection');
    let isGenerating = false;

    // Function to update UI state
    function updateUIState(generating) {
        isGenerating = generating;
        generateButton.disabled = generating;
        visualizeButton.disabled = generating || !summaryTextArea.value;
        modelSelect.disabled = generating;
        videoUrlInput.disabled = generating;
        generateButton.textContent = generating ? 'Generating...' : 'Generate Summary';
    }

    // Function to update status message
    function updateStatus(message, inMermaid = false) {
        if (inMermaid) {
            mermaidOutput.value = message;
        } else {
            summaryTextArea.value = message;
        }
    }

    // Function to show/hide sections
    function showSection(section) {
        summarySection.classList.toggle('visible', section === 'summary');
        mermaidSection.classList.toggle('visible', section === 'mermaid');
    }

    // Get current YouTube URL
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs[0]?.url?.includes('youtube.com/watch')) {
            videoUrlInput.value = tabs[0].url;
        }
    } catch (error) {
        console.error('Error getting current tab:', error);
    }

    // Load available models
    try {
        updateStatus('Loading available models...');
        showSection('summary');
        const response = await chrome.runtime.sendMessage({
            action: 'ollamaApi',
            endpoint: '/api/tags'
        });

        if (response.error) {
            updateStatus('Error loading models: ' + response.error);
            return;
        }

        const models = response.data.models || [];
        if (models.length === 0) {
            updateStatus('No models found. Please install at least one model using the Ollama CLI (e.g., "ollama pull mistral")');
            generateButton.disabled = true;
            return;
        }

        modelSelect.innerHTML = models
            .map(model => `<option value="${model.name}">${model.name}</option>`)
            .join('');
        
        updateStatus('Ready to generate summary. Click the button above to start.');
        generateButton.disabled = false;
    } catch (error) {
        updateStatus('Failed to load models. Please ensure Ollama is running.');
        generateButton.disabled = true;
    }

    generateButton.addEventListener('click', async () => {
        if (isGenerating) return;
        
        const selectedModel = modelSelect.value;
        if (!selectedModel) {
            updateStatus('Please select a model first');
            return;
        }

        try {
            updateUIState(true);
            showSection('summary');
            updateStatus('Getting video transcript...');

            // Get transcript
            const transcriptResponse = await chrome.runtime.sendMessage({
                action: 'getTranscript',
                url: videoUrlInput.value
            });

            if (transcriptResponse.error) {
                throw new Error(transcriptResponse.error);
            }

            if (!transcriptResponse.transcript) {
                throw new Error('No transcript found for this video');
            }

            updateStatus('Generating summary...\nThis may take up to 30 seconds.');

            // Generate summary
            const summaryResponse = await chrome.runtime.sendMessage({
                action: 'ollamaApi',
                endpoint: '/api/generate',
                method: 'POST',
                body: JSON.stringify({
                    model: selectedModel,
                    prompt: `Please provide a concise summary of this transcript:\n\n${transcriptResponse.transcript}`,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                        max_tokens: 500
                    }
                })
            });

            if (summaryResponse.error) {
                throw new Error(summaryResponse.error);
            }

            summaryTextArea.value = summaryResponse.data.response;
            visualizeButton.disabled = false;
        } catch (error) {
            updateStatus('Error: ' + error.message);
            visualizeButton.disabled = true;
        } finally {
            updateUIState(false);
        }
    });

    visualizeButton.addEventListener('click', async () => {
        if (isGenerating || !summaryTextArea.value) return;

        const selectedModel = modelSelect.value;
        if (!selectedModel) {
            updateStatus('Please select a model first', true);
            return;
        }

        try {
            updateUIState(true);
            showSection('mermaid');
            updateStatus('Generating visualization...\nThis may take a moment.', true);

            // Generate Mermaid diagram
            const mermaidResponse = await chrome.runtime.sendMessage({
                action: 'ollamaApi',
                endpoint: '/api/generate',
                method: 'POST',
                body: JSON.stringify({
                    model: selectedModel,
                    prompt: `Transform this summary into a Mermaid diagram:\n\n${summaryTextArea.value}`,
                    stream: false
                })
            });

            if (mermaidResponse.error) {
                throw new Error(mermaidResponse.error);
            }

            mermaidOutput.value = mermaidResponse.data.response;
        } catch (error) {
            updateStatus('Error generating visualization: ' + error.message, true);
        } finally {
            updateUIState(false);
        }
    });
}); 