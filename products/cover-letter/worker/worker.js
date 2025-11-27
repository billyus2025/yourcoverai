const PRODUCT_CONFIG = {
  name: "AI Cover Letter Generator",
  slug: "cover-letter",
  themeColor: "#0f766e",
  model: "gpt-4o-mini",
  systemPrompt: `You are a senior HR specialist and a top-tier career coach. Your job is to generate professional, compelling, personalized cover letters that match the user's background and the job description. Use a confident, human tone. Personalize based on user experience. Highlight achievements. Max 4 paragraphs. No generic filler. Include a strong closing.`
};

// Simple hash function for fingerprinting
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// Generate random license key
function generateLicenseKey() {
  return `yc_${crypto.randomUUID()}`;
}

// Get current date string (YYYY-MM-DD)
function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Check license validity and usage
async function checkLicense(env, licenseKey) {
  try {
    const licenseData = await env.LICENSES.get(`license:${licenseKey}`);
    if (!licenseData) {
      return { valid: false, reason: 'not_found' };
    }

    const license = JSON.parse(licenseData);
    
    // Check if license is valid
    if (!license.plan || !['monthly', 'yearly'].includes(license.plan)) {
      return { valid: false, reason: 'invalid_plan' };
    }

    // Update usage count
    license.used = (license.used || 0) + 1;
    await env.LICENSES.put(`license:${licenseKey}`, JSON.stringify(license));

    return { valid: true, license };
  } catch (error) {
    console.error('Error checking license:', error);
    return { valid: false, reason: 'error' };
  }
}

// Check free tier usage
async function checkFreeUsage(env, fingerprint) {
  const dateStr = getDateString();
  const key = `${fingerprint}:${dateStr}`;

  try {
    const usageData = await env.FREE_USAGE.get(key);
    let usage = usageData ? JSON.parse(usageData) : { count: 0 };

    if (usage.count >= 3) {
      return { allowed: false, count: usage.count };
    }

    // Increment and save
    usage.count += 1;
    await env.FREE_USAGE.put(key, JSON.stringify(usage), { expirationTtl: 86400 }); // 24 hours

    return { allowed: true, count: usage.count };
  } catch (error) {
    console.error('Error checking free usage:', error);
    return { allowed: false, count: 0 };
  }
}

// Call OpenAI API
async function callOpenAI(apiKey, messages, model) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("OpenAI API error:", res.status, errorText);
    throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

// Handle /api/generate
async function handleGenerate(request, env) {
  try {
    const { input, target_language = "en" } = await request.json();

    if (!input) {
      return new Response(JSON.stringify({
        error: "Missing input field"
      }), {
        status: 400,
        headers: {"Content-Type":"application/json"}
      });
    }

    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: "OPENAI_API_KEY not configured"
      }), {
        status: 500,
        headers: {"Content-Type":"application/json"}
      });
    }

    // Check license or free usage
    const licenseKey = request.headers.get("x-license-key");
    let canProceed = false;

    if (licenseKey) {
      // Check license
      const licenseCheck = await checkLicense(env, licenseKey);
      if (licenseCheck.valid) {
        canProceed = true;
      } else {
        // Invalid license, fall back to free tier
        console.log('Invalid license, falling back to free tier');
      }
    }

    if (!canProceed) {
      // Free tier check
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "unknown";
      const fingerprint = await hashString(`${ip}:${ua}`);

      const freeCheck = await checkFreeUsage(env, fingerprint);
      if (!freeCheck.allowed) {
        return new Response(JSON.stringify({
          error: "free_limit_reached",
          message: "Free limit reached. Please upgrade to continue.",
          upgrade_url: "/#pricing"
        }), {
          status: 200,
          headers: {"Content-Type":"application/json"}
        });
      }
      canProceed = true;
    }

    // Generate cover letter
    const languageNames = {
      en: "English", zh: "Chinese", es: "Spanish", fr: "French",
      de: "German", pt: "Portuguese", ja: "Japanese", ko: "Korean",
      ar: "Arabic", hi: "Hindi"
    };

    const targetLangName = languageNames[target_language] || languageNames["en"];

    const systemPrompt = `You are a top HR specialist and a top-tier career coach. Your job is to generate professional, compelling, personalized cover letters that match the user's background and the job description.

IMPORTANT: Generate the cover letter in ${targetLangName}. The tone, style, and format should match professional standards and cultural conventions of ${targetLangName}-speaking regions.

Requirements:
- Use a confident, human-sounding tone appropriate for ${targetLangName} business communication
- Personalize the letter using the user's experience and background
- Highlight achievements and metrics when available
- Format cleanly: maximum 4 paragraphs
- Avoid generic filler content
- Include a strong, professional closing statement
- Ensure the cover letter is written entirely in ${targetLangName} with proper grammar and cultural appropriateness`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: input }
    ];

    const out = await callOpenAI(env.OPENAI_API_KEY, messages, PRODUCT_CONFIG.model);

    return new Response(JSON.stringify({ output: out }), {
      headers: {"Content-Type":"application/json"}
    });

  } catch (error) {
    console.error("Error in generate handler:", error);
    return new Response(JSON.stringify({
      error: error.message || "Internal server error"
    }), {
      status: 500,
      headers: {"Content-Type":"application/json"}
    });
  }
}

// Handle /api/checkout
async function handleCheckout(request, env) {
  try {
    // Handle OPTIONS for CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const { plan } = await request.json();

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return new Response(JSON.stringify({
        error: "Invalid plan. Must be 'monthly' or 'yearly'"
      }), {
        status: 400,
        headers: {"Content-Type":"application/json"}
      });
    }

    if (!env.STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({
        error: "STRIPE_SECRET_KEY not configured"
      }), {
        status: 500,
        headers: {"Content-Type":"application/json"}
      });
    }

    const priceId = plan === "yearly" 
      ? env.STRIPE_PRICE_YEARLY 
      : env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return new Response(JSON.stringify({
        error: `STRIPE_PRICE_${plan.toUpperCase()} not configured`
      }), {
        status: 500,
        headers: {"Content-Type":"application/json"}
      });
    }

    // Create Stripe Checkout Session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url: `${env.APP_BASE_URL || 'https://yourcoverai.billyus2025.workers.dev'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.APP_BASE_URL || 'https://yourcoverai.billyus2025.workers.dev'}/cancel.html`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe API error: ${response.status} ${errorText}`);
    }

    const session = await response.json();

    return new Response(JSON.stringify({
      id: session.id,
      url: session.url
    }), {
      status: 200,
      headers: {"Content-Type":"application/json"}
    });

  } catch (error) {
    console.error("Error in checkout handler:", error);
    const errorMessage = error.message || "Internal server error";
    console.error("Checkout error details:", {
      message: errorMessage,
      stack: error.stack,
      env: {
        hasSecretKey: !!env.STRIPE_SECRET_KEY,
        hasMonthlyPrice: !!env.STRIPE_PRICE_MONTHLY,
        hasYearlyPrice: !!env.STRIPE_PRICE_YEARLY,
        hasBaseUrl: !!env.APP_BASE_URL
      }
    });
    return new Response(JSON.stringify({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: {"Content-Type":"application/json"}
    });
  }
}

// Handle /api/checkout/success
async function handleCheckoutSuccess(request, env) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return new Response(JSON.stringify({
        error: "Missing session_id parameter"
      }), {
        status: 400,
        headers: {"Content-Type":"application/json"}
      });
    }

    if (!env.STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({
        error: "STRIPE_SECRET_KEY not configured"
      }), {
        status: 500,
        headers: {"Content-Type":"application/json"}
      });
    }

    // Retrieve Stripe session
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=subscription`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe API error: ${response.status} ${errorText}`);
    }

    const session = await response.json();

    // Check if payment is successful
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return new Response(JSON.stringify({
        error: "Payment not completed",
        status: session.payment_status
      }), {
        status: 400,
        headers: {"Content-Type":"application/json"}
      });
    }

    // Determine plan from subscription
    const subscription = session.subscription;
    let plan = 'monthly';
    if (subscription && subscription.items && subscription.items.data && subscription.items.data[0]) {
      const priceId = subscription.items.data[0].price.id;
      if (priceId === env.STRIPE_PRICE_YEARLY) {
        plan = 'yearly';
      }
    }

    // Generate and save license
    const licenseKey = generateLicenseKey();
    const licenseData = {
      plan: plan,
      createdAt: new Date().toISOString(),
      max: -1, // -1 means unlimited
      used: 0
    };

    await env.LICENSES.put(`license:${licenseKey}`, JSON.stringify(licenseData));

    return new Response(JSON.stringify({
      status: "ok",
      license: licenseKey,
      plan: plan
    }), {
      status: 200,
      headers: {"Content-Type":"application/json"}
    });

  } catch (error) {
    console.error("Error in checkout success handler:", error);
    return new Response(JSON.stringify({
      error: error.message || "Internal server error"
    }), {
      status: 500,
      headers: {"Content-Type":"application/json"}
    });
  }
}

// Main router
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Route: /api/generate
    if (pathname === "/api/generate") {
      if (method === "GET") {
        return new Response(JSON.stringify({
          status: "ok",
          message: "API online. Use POST to send input."
        }), {
          status: 200,
          headers: {"Content-Type":"application/json"}
        });
      }
      if (method === "POST") {
        return handleGenerate(request, env);
      }
    }

    // Route: /api/checkout
    if (pathname === "/api/checkout" && method === "POST") {
      return handleCheckout(request, env);
    }

    // Route: /create-checkout-session
    if (pathname === "/create-checkout-session" && method === "POST") {
      return handleCheckout(request, env);
    }

    // Route: /api/checkout/success
    if (pathname === "/api/checkout/success" && method === "GET") {
      return handleCheckoutSuccess(request, env);
    }

    // Route: /checkout-success
    if (pathname === "/checkout-success" && method === "GET") {
      return handleCheckoutSuccess(request, env);
    }

    // Route: /api/usage/report (optional, for statistics)
    if (pathname === "/api/usage/report" && method === "POST") {
      // Placeholder for future usage reporting
      return new Response(JSON.stringify({
        status: "ok",
        message: "Usage reported"
      }), {
        status: 200,
        headers: {"Content-Type":"application/json"}
      });
    }

    // Handle OPTIONS requests for CORS
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-license-key"
        }
      });
    }

    // Return 404 for unmatched routes (not 405)
    return new Response(JSON.stringify({
      error: "Not Found",
      message: `Route ${pathname} with method ${method} not found`
    }), {
      status: 404,
      headers: {"Content-Type":"application/json"}
    });
  }
};
