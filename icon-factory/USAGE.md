# Icon Factory - Usage Guide

## Quick Start

### 1. Set OpenAI API Key

```bash
export OPENAI_API_KEY="your-openai-api-key-here"
```

### 2. Generate Icons

#### Single Icon
```bash
cd icon-factory
node worker.js <name> [style]
```

#### Batch Generation (Using Test Script)
```bash
cd icon-factory
./test.sh
```

## Examples

### Generate YourCoverAI Icon (Professional Style)
```bash
node worker.js yourcoverai professional
```
**Output**: `icon-factory/outputs/yourcoverai.png`

### Generate TarotAI Icon (Magic Style)
```bash
node worker.js tarotai magic
```
**Output**: `icon-factory/outputs/tarotai.png`

### Generate ExcelAI Icon (Tech Style)
```bash
node worker.js excelai tech
```
**Output**: `icon-factory/outputs/excelai.png`

## Available Styles

- `professional` - Corporate, teal gradient
- `fantasy` - Mystic, tarot symbols
- `neon` - Cyberpunk, futuristic
- `minimal` - Simple, geometric
- `cute` - Soft pastel, kawaii
- `abstract` - AI-themed neural shapes
- `gradient` - Smooth SaaS gradients
- `tech` - Circuit, AI, code symbols
- `magic` - Divination, stars, moon
- `elegant` - Premium gold, luxury

## Output

All icons are generated as:
- **Format**: PNG
- **Size**: 1024x1024 pixels
- **Location**: `icon-factory/outputs/<name>.png`

## Automatic Git Operations

After generation, the script automatically:
1. ✅ Adds the icon to git
2. ✅ Commits with message: "Generate icon for <name>"
3. ✅ Pushes to GitHub main branch

## Customization

### Modify Styles
Edit `config.json` to add or modify style descriptions.

### Modify Prompt Template
Edit `prompts/base.txt` to change the icon generation prompt.

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"
- Make sure you've exported the API key: `export OPENAI_API_KEY="your-key"`

### "OpenAI API error"
- Check your API key is valid
- Ensure you have DALL-E API access
- Check your OpenAI account balance

### Git operations fail
- Ensure you're in a git repository
- Check git credentials are configured
- Verify you have push permissions

