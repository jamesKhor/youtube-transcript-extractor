// Ollama API service
class OllamaService {
    static async makeRequest(endpoint, options = {}) {
        const url = `http://localhost:11434${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Origin': chrome.runtime.getURL('')
                },
                mode: 'cors',
                credentials: 'omit'
            });

            const text = await response.text();

            if (!response.ok) {
                const errorDetails = {
                    error: `Ollama API error (${response.status} ${response.statusText})`,
                    url,
                    method: options.method || 'GET',
                    requestBody: options.body ? JSON.parse(options.body) : null,
                    responseStatus: response.status,
                    responseStatusText: response.statusText,
                    responseBody: text
                };

                if (endpoint === '/api/generate') {
                    await this.saveErrorLog('generate_error.txt', errorDetails);
                }

                throw new Error(`Ollama API error (${response.status} ${response.statusText}): ${text}`);
            }

            return text ? JSON.parse(text) : null;
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error(`Could not connect to Ollama API. Please ensure:\n1. Ollama is running (http://localhost:11434)\n2. OLLAMA_ORIGINS=* is set\n3. No firewall is blocking the connection\n\nError: ${error.message}`);
            }
            throw error;
        }
    }

    static async generateSummary(modelName, transcript) {
        try {
            // First check if the model exists
            const models = await this.listModels();
            const modelExists = models.some(m => m.name === modelName || m.name === `${modelName}:latest`);
            
            if (!modelExists) {
                throw new Error(`Model "${modelName}" not found. Please run 'ollama pull ${modelName}' first.`);
            }

            const structuredPrompt = `Please analyze the following transcript and provide a structured summary in Markdown format with these sections:

1. ONE SENTENCE SUMMARY:
Create a single, 20-word sentence that captures the essence of the content.

2. MAIN POINTS:
List the 10 most important points, using no more than 15 words per point. Number each point.

3. TAKEAWAYS:
List 5 key takeaways from the content. Number each takeaway.

Rules:
- Use only human readable Markdown
- Use numbered lists, not bullets
- Do not repeat items between sections
- Do not start items with the same opening words
- Keep formatting clean and consistent

Transcript to analyze:
${transcript}`;

            const requestBody = {
                model: modelName,
                prompt: structuredPrompt,
                stream: false
            };

            const data = await this.makeRequest('/api/generate', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            if (!data || !data.response) {
                throw new Error('Invalid response format from Ollama API');
            }

            return data.response;
        } catch (error) {
            const errorMessage = this.formatErrorMessage(error, modelName, transcript);
            throw new Error(errorMessage);
        }
    }

    static async listModels() {
        try {
            const data = await this.makeRequest('/api/tags');
            return data.models || [];
        } catch (error) {
            throw new Error(`Failed to list models: ${error.message}`);
        }
    }

    static formatErrorMessage(error, modelName, transcript) {
        let message = 'Error generating summary:\n\n';
        
        if (error.message.includes('Failed to fetch')) {
            message += `Could not connect to Ollama. Please make sure:\n` +
                `1. Ollama is running locally (http://localhost:11434)\n` +
                `2. The model "${modelName}" is installed (run 'ollama list')\n` +
                `3. No firewall is blocking the connection\n\n` +
                `Full error: ${error.message}`;
        } else {
            message += error.message;
        }

        message += '\n\nDebugging Information:' +
            '\n- Model: ' + modelName +
            '\n- Transcript length: ' + (transcript ? transcript.length : 0) + ' characters' +
            '\n- Error type: ' + error.name +
            '\n- Error stack: ' + error.stack;

        return message;
    }

    static async saveErrorLog(filename, data) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                ...data
            };

            const blob = new Blob([JSON.stringify(logEntry, null, 2)], { type: 'text/plain' });
            const downloadUrl = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Failed to save error log:', error);
        }
    }
} 