# Icon Factory V3: Script Factory

Automated video script and storyboard generator for short-form content platforms (TikTok, YouTube Shorts, 小红书).

## 🚀 Quick Start

### Deploy to Cloudflare

1. **Set up Worker Secret**:
   ```bash
   cd icon-factory-v3
   npx wrangler secret put OPENAI_API_KEY
   # Enter your OpenAI API key when prompted
   ```

2. **Deploy Worker**:
   ```bash
   npx wrangler deploy
   ```

3. **Get Worker URL**:
   After deployment, you'll get a URL like:
   `https://script-factory-api.your-subdomain.workers.dev`

### Usage via API

#### Generate Video Script
```bash
curl -X POST "https://script-factory-api.your-subdomain.workers.dev/video-script" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "YourCoverAI",
    "product_type": "AI cover letter generator",
    "platform": "tiktok",
    "language": "en"
  }'
```

## 📝 API Reference

### POST `/video-script`

Generate a complete video script with storyboard.

**Request Body**:
```json
{
  "name": "Product name",
  "product_type": "Product description",
  "platform": "tiktok | shorts | xiaohongshu",
  "language": "en | zh"
}
```

**Response**:
```json
{
  "status": "ok",
  "name": "YourCoverAI",
  "platform": "tiktok",
  "duration_seconds": 30,
  "language": "en",
  "voiceover_script": "Complete narration text...",
  "scenes": [
    {
      "index": 1,
      "time_range": "0-3s",
      "shot_description": "Visual description...",
      "on_screen_text": "Text overlay...",
      "ui_elements": "UI elements..."
    }
  ],
  "bgm_style": "upbeat, modern, techy",
  "cta": {
    "text": "Try YourCoverAI for free",
    "url": "https://yourcoverai.com"
  }
}
```

## 🎬 Supported Platforms

### TikTok
- Fast-paced, energetic
- Strong hook in first 3 seconds
- Bold, emoji-friendly subtitles
- Trend-focused content

### YouTube Shorts
- Moderate-fast pace
- Informative, value-driven
- Clear, readable subtitles
- Allows longer explanations

### 小红书 (Xiaohongshu)
- Authentic, experience-focused
- Elegant, minimal subtitles
- Community-driven tone
- Aesthetic-focused

## 🌍 Supported Languages

- `en` - English
- `zh` - 中文 (Chinese)

## 📋 Output Structure

The generated script includes:

1. **Voiceover Script**: Complete narration text
2. **Scenes**: Detailed scene-by-scene breakdown with:
   - Time ranges
   - Visual shot descriptions
   - On-screen text/subtitles
   - UI elements to overlay
3. **BGM Style**: Background music recommendation
4. **CTA**: Call-to-action text and URL

## 🔧 Configuration

### Cloudflare Worker Environment
- `OPENAI_API_KEY`: Set as Worker Secret (configured once in Cloudflare Dashboard)
- No local environment variables needed

## 🧪 Testing Examples

### Example 1: YourCoverAI (TikTok, English)
```bash
curl -X POST "https://script-factory-api.your-subdomain.workers.dev/video-script" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "YourCoverAI",
    "product_type": "AI cover letter generator",
    "platform": "tiktok",
    "language": "en"
  }'
```

### Example 2: TarotAI (TikTok, English)
```bash
curl -X POST "https://script-factory-api.your-subdomain.workers.dev/video-script" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TarotAI",
    "product_type": "AI tarot reading app",
    "platform": "tiktok",
    "language": "en"
  }'
```

### Example 3: ExcelAI (小红书, 中文)
```bash
curl -X POST "https://script-factory-api.your-subdomain.workers.dev/video-script" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ExcelAI",
    "product_type": "AI Excel assistant",
    "platform": "xiaohongshu",
    "language": "zh"
  }'
```

## 🎨 Using Scripts in Video Editors

### CapCut / 剪映 Workflow

1. **Import Script JSON**: Use the generated JSON as reference
2. **Create Scenes**: Follow the `scenes` array in order
3. **Add Voiceover**: Use the `voiceover_script` for narration
4. **Add Subtitles**: Use `on_screen_text` for each scene
5. **Add UI Elements**: Overlay elements from `ui_elements`
6. **Add BGM**: Choose music matching `bgm_style`
7. **Add CTA**: Include the call-to-action at the end

### Manual Steps

1. Open CapCut/剪映
2. Create new project
3. For each scene:
   - Add video/image matching `shot_description`
   - Add text overlay from `on_screen_text`
   - Set duration to match `time_range`
   - Add UI elements if needed
4. Record or add voiceover using `voiceover_script`
5. Add background music matching `bgm_style`
6. Add CTA overlay at the end

## 🐛 Troubleshooting

### "OPENAI_API_KEY not configured"
- Set the secret: `npx wrangler secret put OPENAI_API_KEY`
- Verify: `npx wrangler secret list`

### "Invalid platform"
- Must be: `tiktok`, `shorts`, or `xiaohongshu`

### "Invalid language"
- Must be: `en` or `zh`

### JSON Parsing Errors
- The Worker automatically handles JSON extraction from markdown code blocks
- If issues persist, check OpenAI API response format

