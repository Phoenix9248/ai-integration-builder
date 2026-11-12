# AI Integration Builder

AI-powered SaaS integration builder that automatically generates integration code by reading API documentation.

## Features

- 🤖 **AI-Powered**: Uses Ollama (local LLM) to read and understand API documentation
- 🔧 **Auto-Generate**: Automatically generates integration code
- 🚀 **Self-Serve**: Users can add any integration themselves
- 📊 **Live Testing**: Tests generated integrations with real APIs
- 💯 **100% Free**: Runs locally, no API keys or internet required!

## How It Works

1. User enters tool name (e.g., "Calendly") and API docs URL
2. AI reads the API documentation and extracts:
   - Authentication method
   - API endpoints
   - Data models
3. AI generates working integration code
4. User provides API key
5. Integration connects and pulls real data

## Setup

1. **Install Ollama** (if not already installed):
   - Mac/Linux: `curl -fsSL https://ollama.com/install.sh | sh`
   - Or download from: https://ollama.com/download

2. **Pull the AI model**:
   ```bash
   ollama pull qwen2.5-coder:7b
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open browser**: http://localhost:3000

**That's it!** No API keys, no sign-ups, 100% local and free.

## Usage

### Example: Add Calendly Integration

1. Click "Add New Integration"
2. Enter:
   - **Tool Name**: Calendly
   - **API Docs URL**: https://developer.calendly.com/api-docs
3. Click "Analyze API" - AI reads the documentation
4. Click "Generate Integration Code" - AI creates the code
5. Enter your Calendly API key
6. Click "Connect & Test"

### Try with other tools:

- **Linear**: https://developers.linear.app/docs
- **Notion**: https://developers.notion.com/reference/intro
- **GitHub**: https://docs.github.com/en/rest
- **Any other SaaS tool with API documentation**

## Tech Stack

- **Backend**: Node.js + Express
- **AI**: Ollama + Qwen 2.5 Coder (7B) - runs locally!
- **Frontend**: Vanilla JavaScript + CSS
- **Zero external dependencies** - works offline!

## Project Structure

```
ai-integration-builder/
├── server/
│   ├── index.js          # Express server
│   ├── groq.js           # AI integration (read docs, generate code)
│   ├── integrations.js   # Store & manage integrations
│   └── generated/        # Generated integration code files
├── public/
│   ├── index.html        # Frontend UI
│   ├── style.css         # Styling
│   └── app.js            # Frontend logic
├── .env                  # API keys (gitignored)
└── package.json
```

## Development

```bash
# Install dependencies
npm install

# Run with auto-reload
npm run dev

# Production
npm start
```

## Notes

- Generated integrations are stored in-memory (reset on server restart)
- Integration code is saved to `server/generated/` directory
- API keys are stored in-memory only (not persisted)

## Next Steps

- [ ] Persist integrations to database
- [ ] Add more robust error handling
- [ ] Support OAuth flows (not just API keys)
- [ ] Add integration testing suite
- [ ] Deploy to production
