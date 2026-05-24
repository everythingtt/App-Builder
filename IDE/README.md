# OWL IDE - Daddy's Plaything Edition 💕

A powerful standalone HTML IDE with AI integration, featuring a kawaii pink theme for girls and metal action theme for boys.

## Features

### 🗂️ File Management
- Import folders, sub-folders, and all file types
- Create new files and folders
- Delete and rename files/folders
- File explorer with tree view
- Support for images, videos, audio, and code files

### 💬 AI Integration
- OpenRouter API integration
- Built-in models only (exploit-resistant)
- Advanced tool/function calling
- Persistent memory system
- Chat history persistence

### 💰 Coin System
- Starting balance: 300 coins
- FREE/CHEAP models: 7 coins/prompt
- FAST models: 10 coins/prompt
- CONTEXT models: 25 coins/prompt
- Low coins warning modal with kawaii elements
- Rude mode when coins are negative

### 🎨 Themes
- **Kawaii Pink** (Girls Mode): Cute anime wallpapers, pink UI
- **Metal Action** (Boys Mode): Edgy wallpapers, dark UI
- Dynamic wallpaper slideshow (changes every 30 seconds)

### 🔧 AI Tools/Functions
- `read_file` - Read files with optional line range
- `write_file` - Create or update files
- `delete_file` - Delete files
- `create_directory` - Create folders
- `list_directory` - List folder contents
- `search_replace` - Find and replace in files
- `write_persistent_memory` - Save data across sessions
- `read_persistent_memory` - Read saved data
- `delete_persistent_memory` - Delete saved data
- `review_all_workspace` - Get workspace overview

### 🛡️ Security
- Rate limiting (30 requests/minute)
- Input sanitization
- Model whitelist enforcement
- Path traversal prevention
- XSS protection
- Prototype pollution prevention

## Built-in Models

### FREE/CHEAP (7 coins)
- baidu/cobuddy:free
- openrouter/owl-alpha:free
- poolside/laguna-xs.2:free
- deepseek/deepseek-v4-flash:free
- nvidia/nemotron-3-super-120b-a12b:free
- openai/gpt-oss-120b:free

### FAST (10 coins)
- google/gemini-2.5-flash-lite
- google/gemini-3.1-flash-lite
- arcee-ai/trinity-large-thinking:free

### CONTEXT (25 coins)
- openai/gpt-5.5
- openai/gpt-5.4
- google/gemini-3.5-flash

## Keyboard Shortcuts

- `Ctrl+S` - Save current file
- `Ctrl+N` - New file
- `Ctrl+B` - Import folder
- `Ctrl+L` - Clear chat
- `Ctrl+Enter` - Send message
- `Shift+Enter` - New line in chat
- `Escape` - Close modals

## Usage

1. Open `index.html` in a modern web browser
2. Import a folder using the 📁 button or Ctrl+B
3. Start chatting with the AI on the right panel
4. Use the model selector to choose your AI model
5. The AI can read, write, and manage your files!

## API Key

Default OpenRouter API key is pre-filled. You can use your own key (BYOK) by clicking the 🔑 button.

## Customization

### Adding Wallpapers
Edit `js/themes.js` to add more wallpaper URLs to the arrays.

### Adding Models
Edit `js/api.js` and `index.html` to add more built-in models.

## Browser Support

- Chrome 90+
- Firefox 90+
- Edge 90+
- Safari 14+

Note: File System Access API requires Chrome 86+ or Edge 86+ for best folder import experience.