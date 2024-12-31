# YouTube Transcript Extractor (YTCC)

A Microsoft Edge extension that allows you to extract transcripts from YouTube videos and prepare them for AI summarization. Perfect for students, researchers, and content creators who need to quickly access and process video content.

## Features

- 🎯 Extract transcripts from any YouTube video with captions
- 🔄 Works with current video or any YouTube URL
- 📋 One-click copy to clipboard functionality
- 🤖 Prepare transcripts for AI summarization (coming soon)
- 🌐 Support for multiple languages (planned)
- 🎨 Clean, modern user interface

## Installation

### From Microsoft Edge Add-ons Store (Coming Soon)
1. Visit the extension page on Microsoft Edge Add-ons store
2. Click "Get" to install the extension
3. Follow the prompts to add the extension to your browser

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Microsoft Edge and go to `edge://extensions/`
3. Enable "Developer mode" in the bottom-left corner
4. Click "Load unpacked"
5. Select the folder containing this extension

## Usage

1. Navigate to any YouTube video
2. Click the YTCC extension icon in your toolbar
3. If you're on a YouTube video page, the URL will be automatically filled
4. Click "Get Transcript" to fetch the video transcript
5. Use "Copy Transcript" to copy the text to your clipboard
6. (Coming soon) Click "Summarize" to get an AI-generated summary

## Requirements

- Microsoft Edge, and Chrome browser
- YouTube videos must have closed captions/subtitles available
- [Ollama](https://ollama.ai) installed for AI summarization features

## Ollama Setup

For the AI summarization features to work, Ollama needs to be running with CORS enabled. Follow these platform-specific instructions:

### Linux/macOS

1. Start Ollama with CORS enabled:
```bash
OLLAMA_ORIGINS=* ollama serve
```

2. To make it permanent, add to your `~/.bashrc` or `~/.zshrc`:
```bash
export OLLAMA_ORIGINS=*
```
Then restart your terminal or run:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

### Windows

1. Using PowerShell, set the environment variable and start Ollama:
```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
```

2. To make it permanent (PowerShell as Administrator):
```powershell
[System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', [System.EnvironmentVariableTarget]::User)
```
Then restart PowerShell.

### Docker

Run Ollama in a Docker container with CORS enabled:
```bash
docker run -d \
  --name ollama \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  -e OLLAMA_ORIGINS="*" \
  ollama/ollama
```

### Verifying the Setup

1. After starting Ollama, verify it's running by visiting:
```
http://localhost:11434/api/tags
```

2. You should see a JSON response listing available models.

### Troubleshooting Ollama

If the extension can't connect to Ollama:

1. Verify Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

2. Check if CORS is enabled:
   - Look for the OLLAMA_ORIGINS environment variable
   - Restart Ollama after changing environment variables
   - Check your firewall settings

3. Common issues:
   - "Failed to fetch" error: Ollama not running or CORS not enabled
   - "Model not found": Run `ollama pull modelname` first
   - Connection refused: Port 11434 blocked by firewall

### Security Note

Setting `OLLAMA_ORIGINS=*` allows requests from any origin. For production use:
- Limit OLLAMA_ORIGINS to specific trusted domains
- Consider implementing additional security measures
- Only use * for development/testing purposes

## Privacy Policy

This extension:
- Only accesses YouTube video pages when explicitly requested
- Does not collect any personal information
- Does not track user behavior
- Does not store any data except user preferences
- Does not modify any website content

## Support

If you encounter any issues or have suggestions:
- Open an issue on our GitHub repository
- Contact us through the support email (coming soon)

## Contributing

We welcome contributions! If you'd like to help improve this extension:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Version History

- 1.0.0: Initial release
  - Basic transcript extraction
  - Copy to clipboard functionality
  - Support for YouTube URLs

## Acknowledgments

- Thanks to all contributors and users
- Special thanks to the YouTube community

## Future Features

- AI-powered summarization
- Multiple language support
- Custom AI processing options
- Transcript formatting options
- Export to different formats
- Theme customization 