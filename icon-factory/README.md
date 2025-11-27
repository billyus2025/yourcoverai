# Icon Factory

Automated icon generation module using OpenAI DALL-E via Cloudflare Worker.

## 🚀 Quick Start (Cloudflare Worker)

### Deploy to Cloudflare

1. **Set up Worker Secret**:
   ```bash
   cd icon-factory
   npx wrangler secret put OPENAI_API_KEY
   # Enter your OpenAI API key when prompted
   ```

2. **Deploy Worker**:
   ```bash
   npx wrangler deploy
   ```

3. **Get Worker URL**:
   After deployment, you'll get a URL like:
   `https://icon-factory-api.your-subdomain.workers.dev`

### Usage via API

#### Generate Icon
```bash
curl -X POST "https://icon-factory-api.your-subdomain.workers.dev/icon-factory-api/generate-icon" \
  -H "Content-Type: application/json" \
  -d '{"name":"yourcoverai","style":"professional"}'
```

Response:
```json
{
  "status": "ok",
  "name": "yourcoverai",
  "style": "professional",
  "base64": "iVBORw0KGgoAAAANS...",
  "url": "https://oaidalleapiprodscus...",
  "revised_prompt": "...",
  "format": "png",
  "size": "1024x1024"
}
```

#### Generate Assets (V2 - Multiple Sizes)
```bash
curl -X POST "https://icon-factory-api.your-subdomain.workers.dev/icon-factory-api/generate-assets" \
  -H "Content-Type: application/json" \
  -d '{"name":"yourcoverai","style":"professional","sizes":["1024","512","256"]}'
```

#### Health Check
```bash
curl "https://icon-factory-api.your-subdomain.workers.dev/icon-factory-api/health"
```

## 📝 Local Development (Legacy)

> **Note**: The local Node.js version is kept for development/testing. For production, use the Cloudflare Worker API.

### Prerequisites
- Node.js installed
- OpenAI API Key (for local testing only)

### Local Usage
```bash
export OPENAI_API_KEY="your-api-key"  # Only needed for local testing
cd icon-factory
node worker.js <name> [style]
```

## 🎨 Available Styles

- `professional` - sleek, teal gradient, corporate style
- `fantasy` - mystic tarot symbols, gold-purple gradient
- `neon` - cyberpunk neon glow, futuristic
- `minimal` - simple geometric shapes, flat white and gray
- `cute` - soft pastel colors, kawaii style
- `abstract` - AI-themed abstract neural shapes
- `gradient` - smooth SaaS gradient backgrounds
- `tech` - circuit, AI, code symbols
- `magic` - divination, stars, moon, spiritual elements
- `elegant` - premium gold, black, luxury branding

## 📦 Output Format

Icons are generated as:
- **Format**: PNG
- **Size**: 1024x1024 pixels
- **Response**: Base64 encoded string + OpenAI URL

### Saving Base64 to File

```bash
# Using jq and base64
curl -X POST "https://icon-factory-api.your-subdomain.workers.dev/icon-factory-api/generate-icon" \
  -H "Content-Type: application/json" \
  -d '{"name":"yourcoverai","style":"professional"}' \
  | jq -r '.base64' | base64 -d > icon.png
```

Or use the `url` field directly:
```bash
curl "https://oaidalleapiprodscus..." -o icon.png
```

## 🔧 Configuration

### Cloudflare Worker Environment
- `OPENAI_API_KEY`: Set as Worker Secret (configured once in Cloudflare Dashboard)
- No local environment variables needed for production use

### Customization
- Edit `config.json` to modify style descriptions
- Edit `prompts/base.txt` to change the icon generation prompt template
- Styles and prompts are embedded in `worker-cloudflare.js` for Worker deployment

## 📚 API Endpoints

### POST `/icon-factory-api/generate-icon`
Generate a single icon.

**Request Body**:
```json
{
  "name": "appname",
  "style": "professional"
}
```

**Response**:
```json
{
  "status": "ok",
  "name": "appname",
  "style": "professional",
  "base64": "...",
  "url": "...",
  "revised_prompt": "...",
  "format": "png",
  "size": "1024x1024"
}
```

### POST `/icon-factory-api/generate-assets`
Generate icon with multiple size support (V2).

**Request Body**:
```json
{
  "name": "appname",
  "style": "professional",
  "sizes": ["1024", "512", "256", "128"]
}
```

### GET `/icon-factory-api/health`
Health check endpoint.

## 🐛 Troubleshooting

### "OPENAI_API_KEY not configured"
- Make sure you've set the secret in Cloudflare: `npx wrangler secret put OPENAI_API_KEY`
- Verify the secret is set: `npx wrangler secret list`

### "OpenAI API error"
- Check your API key is valid
- Ensure you have DALL-E API access
- Check your OpenAI account balance

### CORS Issues
- Add CORS headers in Worker if calling from browser
- Or use server-side requests

## 🔄 Migration from Local to Cloudflare Worker

The Cloudflare Worker version:
- ✅ No local API key needed
- ✅ No git operations (returns base64/URL directly)
- ✅ Scalable and serverless
- ✅ Centralized API key management

Local version (`worker.js`) is still available for:
- Development and testing
- Offline generation
- Custom git workflows
