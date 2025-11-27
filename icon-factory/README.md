# Icon Factory

Automated icon generation module using OpenAI DALL-E.

## Usage

### Command Line

```bash
cd icon-factory
node worker.js <name> [style]
```

Examples:
```bash
node worker.js yourcoverai professional
node worker.js tarotai magic
node worker.js excelai tech
```

### Environment Variables

Set `OPENAI_API_KEY` before running:

```bash
export OPENAI_API_KEY="your-api-key-here"
node worker.js yourcoverai professional
```

## Available Styles

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

## Output

Icons are saved to `icon-factory/outputs/<name>.png` (1024x1024 PNG format).

The script automatically:
1. Generates the icon using DALL-E
2. Saves to outputs directory
3. Git add, commit, and push

## Configuration

Edit `config.json` to add or modify styles.

Edit `prompts/base.txt` to modify the icon generation prompt template.

