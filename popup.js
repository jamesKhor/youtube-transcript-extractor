document.addEventListener('DOMContentLoaded', function() {
    const transcriptText = document.getElementById('transcriptText');
    const summaryText = document.getElementById('summaryText');
    const modelList = document.getElementById('modelList');
    const videoUrlInput = document.getElementById('videoUrl');
    let selectedModel = 'mistral';

    // Initialize by loading models and getting current tab URL
    refreshModelList();
    getCurrentTabUrl();

    // Event Listeners
    document.getElementById('refreshModels').addEventListener('click', refreshModelList);
    document.getElementById('downloadMistral').addEventListener('click', () => downloadModel('mistral'));
    document.getElementById('getTranscript').addEventListener('click', getTranscript);
    document.getElementById('generateSummary').addEventListener('click', generateSummary);

    // Get current YouTube URL when popup opens
    async function getCurrentTabUrl() {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com/watch')) {
            videoUrlInput.value = tabs[0].url;
        }
    }

    async function refreshModelList() {
        try {
            const models = await OllamaService.listModels();
            modelList.innerHTML = '';
            models.forEach(model => {
                const div = document.createElement('div');
                div.className = 'model-item';
                div.innerHTML = `
                    <span>${model.name}</span>
                    <button onclick="selectModel('${model.name}')">${model.name === selectedModel ? 'Selected' : 'Select'}</button>
                `;
                modelList.appendChild(div);
            });
        } catch (error) {
            console.error('Error refreshing models:', error);
            modelList.innerHTML = `<p style="color: red;">Error loading models: ${error.message}</p>`;
        }
    }

    async function downloadModel(modelName) {
        try {
            const downloadBtn = document.getElementById('downloadMistral');
            downloadBtn.disabled = true;
            downloadBtn.textContent = 'Downloading...';
            
            await OllamaService.pullModel(modelName);
            await refreshModelList();
            
            downloadBtn.textContent = 'Download Mistral';
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('Error downloading model:', error);
            alert(`Error downloading model: ${error.message}`);
            downloadBtn.textContent = 'Download Failed';
            downloadBtn.disabled = false;
        }
    }

    function selectModel(modelName) {
        selectedModel = modelName;
        refreshModelList();
    }

    async function getTranscript() {
        const url = videoUrlInput.value;
        if (!url) {
            transcriptText.value = 'Please enter a YouTube URL';
            return;
        }

        if (!url.includes('youtube.com/watch')) {
            transcriptText.value = 'Please enter a valid YouTube video URL';
            return;
        }

        try {
            transcriptText.value = 'Loading transcript...';
            const response = await chrome.runtime.sendMessage({ 
                action: 'getTranscript',
                url: url
            });
            
            if (response.error) {
                transcriptText.value = 'Error: ' + response.error;
                return;
            }
            transcriptText.value = response.transcript;
        } catch (error) {
            console.error('Error getting transcript:', error);
            transcriptText.value = 'Error getting transcript: ' + error.message;
        }
    }

    async function generateSummary() {
        if (!transcriptText.value || transcriptText.value === 'Loading transcript...' || transcriptText.value.startsWith('Error:')) {
            alert('Please get a valid transcript first');
            return;
        }

        const generateBtn = document.getElementById('generateSummary');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        try {
            summaryText.value = 'Generating summary...';
            const summary = await OllamaService.generateSummary(selectedModel, transcriptText.value);
            summaryText.value = summary;
        } catch (error) {
            console.error('Error generating summary:', error);
            summaryText.value = `Error generating summary:\n\n${error.message}`;
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Summary';
        }
    }
}); 