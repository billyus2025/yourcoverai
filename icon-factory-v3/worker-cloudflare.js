// Cloudflare Worker for Icon Factory V3: Video Script & Storyboard Generator
// Deploy this as a Cloudflare Worker

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Route: /video-script
    if (url.pathname === '/video-script' && request.method === 'POST') {
      return handleGenerateScript(request, env);
    }
    
    // Health check
    if (url.pathname === '/video-script/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'Icon Factory V3 - Script Factory' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

// Platform-specific prompt templates
function getPlatformGuidelines(platform) {
  const guidelines = {
    tiktok: {
      hook: "Start with a strong hook in the first 3 seconds that grabs attention immediately.",
      pace: "Fast-paced, energetic, trend-focused",
      style: "Use bold, large subtitles with emojis. Keep scenes short (2-4 seconds each).",
      tone: "Energetic, exciting, relatable"
    },
    shorts: {
      hook: "Start with a clear value proposition in the first 5 seconds.",
      pace: "Moderate-fast, informative",
      style: "Clear, readable subtitles. Allow slightly longer scenes (3-7 seconds) for explanation.",
      tone: "Informative, value-driven, professional"
    },
    xiaohongshu: {
      hook: "Start with an authentic, relatable moment in the first 3 seconds.",
      pace: "Moderate, experience-focused",
      style: "Elegant, minimal subtitles. Focus on aesthetic and real usage experience.",
      tone: "Authentic, community-driven, aesthetic"
    }
  };
  
  return guidelines[platform] || guidelines.tiktok;
}

// Build system prompt for script generation
function buildSystemPrompt(platform, language) {
  const guidelines = getPlatformGuidelines(platform);
  const lang = language === 'zh' ? '中文' : 'English';
  
  return `You are an expert video script writer specializing in short-form content for ${platform.toUpperCase()} platform.

Your task is to create a complete video script with detailed storyboard for a product promotion video.

Platform: ${platform.toUpperCase()}
Language: ${lang}

Platform Guidelines:
- Hook: ${guidelines.hook}
- Pace: ${guidelines.pace}
- Style: ${guidelines.style}
- Tone: ${guidelines.tone}

Output Requirements:
1. Create a ${lang} script that matches ${platform} style
2. Duration: 15-60 seconds (typically 30 seconds)
3. Structure: Hook → Problem → Solution → Demo → CTA
4. Include detailed scene-by-scene breakdown with:
   - Time ranges for each scene
   - Visual shot descriptions
   - On-screen text/subtitles
   - UI elements to show
5. Provide complete voiceover script
6. Suggest background music style
7. Include call-to-action

Return ONLY valid JSON matching this exact structure:
{
  "name": "Product name",
  "platform": "${platform}",
  "duration_seconds": 30,
  "language": "${language}",
  "voiceover_script": "Complete narration in ${lang}...",
  "scenes": [
    {
      "index": 1,
      "time_range": "0-3s",
      "shot_description": "Visual description...",
      "on_screen_text": "Text overlay...",
      "ui_elements": "UI elements..."
    }
  ],
  "bgm_style": "Music style recommendation",
  "cta": {
    "text": "CTA text",
    "url": "Product URL"
  }
}

Ensure all text is in ${lang}. Be creative but practical.`;
}

// Generate video script using OpenAI
async function generateScript(apiKey, userPrompt, platform, language) {
  const systemPrompt = buildSystemPrompt(platform, language);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Parse JSON response
  try {
    return JSON.parse(content);
  } catch (e) {
    // If JSON parsing fails, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error('Failed to parse JSON response from OpenAI');
  }
}

async function handleGenerateScript(request, env) {
  try {
    const { name, product_type, platform = 'tiktok', language = 'en' } = await request.json();

    if (!name || !product_type) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: name and product_type'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['tiktok', 'shorts', 'xiaohongshu'].includes(platform)) {
      return new Response(JSON.stringify({
        error: 'Invalid platform. Must be: tiktok, shorts, or xiaohongshu'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['en', 'zh'].includes(language)) {
      return new Response(JSON.stringify({
        error: 'Invalid language. Must be: en or zh'
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

    // Build user prompt
    const userPrompt = `Create a ${platform} video script for:
- Product Name: ${name}
- Product Type: ${product_type}
- Platform: ${platform}
- Language: ${language}

Generate a complete script with storyboard that showcases this product effectively for ${platform} audience.`;

    // Generate script
    const script = await generateScript(env.OPENAI_API_KEY, userPrompt, platform, language);

    return new Response(JSON.stringify({
      status: 'ok',
      ...script
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating script:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

