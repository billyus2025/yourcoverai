// Cloudflare Worker for Icon Factory
// Deploy this as a Cloudflare Worker

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Route: /icon-factory-api/generate-icon
    if (url.pathname === '/icon-factory-api/generate-icon' && request.method === 'POST') {
      return handleGenerateIcon(request, env);
    }
    
    // Route: /icon-factory-api/generate-assets (V2 feature)
    if (url.pathname === '/icon-factory-api/generate-assets' && request.method === 'POST') {
      return handleGenerateAssets(request, env);
    }
    
    // Health check
    if (url.pathname === '/icon-factory-api/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', service: 'Icon Factory API' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

// Load config and prompt template (embedded in Worker)
const STYLES = {
  "professional": "sleek, teal gradient, corporate style, writing pen theme",
  "fantasy": "mystic tarot symbols, gold-purple gradient, magical aura",
  "neon": "cyberpunk neon glow, futuristic",
  "minimal": "simple geometric shapes, flat white and gray",
  "cute": "soft pastel colors, kawaii style",
  "abstract": "AI-themed abstract neural shapes",
  "gradient": "smooth SaaS gradient backgrounds",
  "tech": "circuit, AI, code symbols",
  "magic": "divination, stars, moon, spiritual elements",
  "elegant": "premium gold, black, luxury branding"
};

const PROMPT_TEMPLATE = `A clean, modern iOS-style app icon for "{{name}}".
Design style: {{style}}.
Key visual element: a simple emblem representing its function.
Minimal, flat, smooth gradients, high contrast, rounded corners.
No text. 1024x1024 PNG, centered composition, crisp details.`;

function buildPrompt(name, style) {
  const styleDescription = STYLES[style] || STYLES.professional;
  return PROMPT_TEMPLATE
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{style\}\}/g, styleDescription);
}

async function generateIcon(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1024',
      quality: 'hd',
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    base64: data.data[0].b64_json,
    url: data.data[0].url || null,
    revised_prompt: data.data[0].revised_prompt || null
  };
}

async function handleGenerateIcon(request, env) {
  try {
    const { name, style = 'professional' } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({
        error: 'Missing required field: name'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'OPENAI_API_KEY not configured in Cloudflare Worker environment'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build prompt
    const prompt = buildPrompt(name, style);
    
    // Generate icon
    const result = await generateIcon(env.OPENAI_API_KEY, prompt);

    return new Response(JSON.stringify({
      status: 'ok',
      name: name,
      style: style,
      base64: result.base64,
      url: result.url,
      revised_prompt: result.revised_prompt,
      format: 'png',
      size: '1024x1024'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating icon:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleGenerateAssets(request, env) {
  try {
    const { name, style = 'professional', sizes = ['1024', '512', '256', '128'] } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({
        error: 'Missing required field: name'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'OPENAI_API_KEY not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate base icon (1024x1024)
    const prompt = buildPrompt(name, style);
    const result = await generateIcon(env.OPENAI_API_KEY, prompt);

    // For V2, we return the base64 and let client resize
    // In future, could use image processing API to generate multiple sizes
    return new Response(JSON.stringify({
      status: 'ok',
      name: name,
      style: style,
      base64: result.base64,
      url: result.url,
      sizes: sizes,
      note: 'Base icon generated at 1024x1024. Client should resize for other sizes.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating assets:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

