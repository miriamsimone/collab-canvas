# AI Canvas Agent Setup Guide

## 🤖 Overview

The AI Canvas Agent allows users to create rectangles using natural language commands like "create a red rectangle at 200, 150". This feature uses a secure Vercel API route with OpenAI GPT-4o-mini for fast, reliable command processing.

## 🔒 Security Architecture

The AI implementation uses a **secure server-side architecture**:

- **Client-Side**: Sends commands to `/api/ai/command` Vercel API route
- **Server-Side**: API route processes commands using OpenAI API with secure key storage
- **Benefit**: OpenAI API key is never exposed to the browser or client-side code

This prevents API key theft and unauthorized usage.

## 📋 Prerequisites

1. **OpenAI API Key**: You need a valid OpenAI API key to use the AI features
2. **Vercel AI SDK**: Already installed in the project dependencies

## 🔧 Setup Steps

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy your API key (it will look like `sk-...`)

### 2. Create Environment File

Create a `.env.local` file in the project root with your API key:

```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:**
- Replace `your_openai_api_key_here` with your actual OpenAI API key
- No `VITE_` prefix - this keeps the API key secure on the server-side only
- Never commit this file to version control (it's already in `.gitignore`)

### 3. Restart Development Server

After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

## 🎯 Usage

### Basic Commands

The AI agent currently supports rectangle creation commands:

- **"create a red rectangle"** - Creates a red rectangle at an available position
- **"create a blue rectangle at 200, 150"** - Creates a blue rectangle at specific coordinates
- **"make a green rectangle 150 wide and 100 tall"** - Creates a rectangle with specific dimensions
- **"add a yellow square"** - Creates a square (equal width/height)

### Color Support

The AI understands both color names and hex codes:

- **Color names**: red, blue, green, yellow, orange, purple, pink, black, white, gray/grey
- **Hex codes**: #ff0000, #0000ff, #00ff00, etc.

### Command Examples

```
✅ "create a red rectangle at 100, 200"
✅ "make a blue square in the center"  
✅ "add a #ff5722 rectangle 200x100"
✅ "create a green rectangle"
❌ "delete all rectangles" (not supported)
❌ "what's the weather?" (not canvas-related)
```

## 🔍 Troubleshooting

### "OpenAI API key is missing or invalid"

1. Check that `.env.local` file exists in project root
2. Verify the API key starts with `sk-`
3. Ensure the variable name is `OPENAI_API_KEY`
4. Restart the development server

### "Rate limit exceeded"

1. You've hit OpenAI's rate limits
2. Wait a few minutes and try again
3. Consider upgrading your OpenAI plan for higher limits

### "AI processing failed"

1. Check your internet connection
2. Verify your OpenAI account has available credits
3. Try a simpler command first

## ⚙️ Configuration

### Model Settings

The AI agent is configured to use:
- **Model**: `gpt-4o-mini` (fast and cost-effective)
- **Max Tokens**: 500 (sufficient for rectangle commands)
- **Timeout**: 10 seconds

### Customization

You can modify AI behavior in `src/services/aiService.ts`:

```typescript
const defaultConfig: AIServiceConfig = {
  model: 'gpt-4o-mini', // Change model here
  maxTokens: 500,       // Increase for complex commands
  timeout: 10000,       // Increase for slower responses
};
```

## 🧪 Testing

The AI system includes comprehensive unit tests:

```bash
# Test AI helpers
npm test -- tests/unit/utils/aiHelpers.test.ts

# Test AI service (mocked)
npm test -- tests/unit/services/aiService.test.ts

# Test all AI components
npm test -- tests/unit/
```

## 🚀 Development

### Architecture

```
User Input → AICommandInput → useAI Hook → aiService → Vercel AI SDK → OpenAI API
                ↓
Canvas Updates ← Rectangle Creation ← Command Processing ← AI Response
```

### Key Files

- `src/services/aiService.ts` - Core AI integration
- `src/hooks/useAI.ts` - React state management
- `src/components/features/AI/` - UI components
- `src/types/ai.ts` - TypeScript interfaces
- `src/utils/aiHelpers.ts` - Utility functions

## 📊 Monitoring

### Success Metrics

- ✅ Command response time: < 2 seconds
- ✅ Success rate: > 85% for valid commands
- ✅ Real-time sync: AI-created rectangles appear on all screens

### Debug Information

Check the browser console for detailed AI processing logs:
- Command parsing results
- API request/response details
- Error messages and stack traces

## 💡 Future Enhancements

The AI system is designed to be extensible:

1. **More Shapes**: Add circles, lines, text when shape types are implemented
2. **Complex Commands**: Multi-step commands like "create a login form"
3. **Modification Commands**: "move the red rectangle to the right"
4. **Layout Commands**: "arrange all rectangles in a grid"

## 🔐 Security

- API keys are stored in environment variables (not in code)
- All AI requests are validated before processing
- Rectangle parameters are sanitized and validated
- No sensitive user data is sent to OpenAI

---

For more help, check the main [README.md](./README.md) or create an issue on GitHub.
