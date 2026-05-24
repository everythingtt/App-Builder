# OWL IDE 🦉

A modern, OpenRouter-integrated web development environment designed for static GitHub Pages hosting. Features advanced page routing, consistent UI/UX, and a powerful AI assistant.

## Architecture

```
openrouter-ide/
├── api/                    # Vercel API middleware
│   ├── github-auth.js      # GitHub App authentication
│   ├── openrouter-proxy.js # OpenRouter API proxy
│   ├── vercel.json         # Vercel configuration
│   └── package.json        # API dependencies
├── src/
│   ├── components/         # UI components
│   │   ├── FileExplorer.js # File explorer component
│   │   ├── ChatPanel.js    # AI chat panel
│   │   └── Editor.js       # Code editor component
│   └── utils/              # Utility modules
│       ├── tokenizer.js    # Client-side tokenization
│       ├── github-api.js   # GitHub API client
│       └── openrouter-client.js # OpenRouter client
└── public/                 # Static files for GitHub Pages
    ├── index.html          # Main HTML
    ├── styles.css          # Global styles
    ├── app.js              # Main application
    └── _headers            # Security headers
```

## Features

- **File Explorer**: Full folder/sub-folder support with directory map preservation
- **Code Editor**: Syntax highlighting, multiple tabs, live editing
- **Live Preview**: HTML preview with iframe sandboxing
- **AI Assistant**: OpenRouter-powered chat with multiple models
- **Token System**: 100 tokens included, per-model costs
- **GitHub Integration**: Save/Load projects using Git-As-A-Database
- **Client-side Tokenization**: Pre-upload context limit checking
- **Responsive Design**: Works on desktop and mobile

## Models & Token Costs

| Model | Tokens/Prompt | Context Limit |
|-------|---------------|---------------|
| OWL Alpha | 2 | 32,768 |
| Cobuddy | 1 | 8,192 |
| Laguna XS.2 | 1 | 16,384 |
| Nemotron 3 Super | 1 | 65,536 |
| GPT-OSS 120B | 1 | 131,072 |
| Qwen3 Coder Next | 11 | 131,072 |
| MiniMax M2.5 | 15 | 131,072 |
| Qwen3 Coder | 22 | 131,072 |

## Deployment

### GitHub Pages

1. Push the `public/` folder to your repository
2. Enable GitHub Pages in repository settings
3. Set source to the root or docs folder

### Vercel API Middleware

1. Deploy the `api/` folder to Vercel
2. Set environment variables:
   - `GITHUB_APP_ID`: Your GitHub App ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub App client secret
   - `PRIVATE_KEY_PATH`: Path to your private key

## GitHub App Configuration

- **Client ID**: Your GitHub App Client ID
- **Client Secret**: `518218b6f1ba4f1771f732206a98045accc05956`
- **Private Key**: Path to PEM file
- **Repository**: `https://github.com/everythingtt/App-Builder.git`

## OpenRouter API Keys

The application includes 4 API keys for load balancing:
- Keys are rotated automatically on rate limits
- Users can add their own key in the settings

## Security

- Content Security Policy headers
- XSS protection
- CORS configuration
- Sandboxed iframe previews
- No server-side storage of API keys

## License

MIT
