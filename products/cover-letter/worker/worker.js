// Refactored Worker using Shared Core
import config from "../config.js";
import { checkLicense, checkFreeUsage, createLicense } from "../../../shared/license.js";
import { createCheckoutSession, verifyStripeSession } from "../../../shared/stripe.js";
import { callOpenAI } from "../../../shared/openai.js";
import { jsonResponse, errorResponse, handleCors, hashString } from "../../../shared/utils.js";
import { sendMagicLink, verifyMagicLink, verifySession, updateUserPlan } from "../../../shared/auth.js";

// Handle /api/generate
async function handleGenerate(request, env) {
  try {
    const { input, target_language = "en" } = await request.json();

    if (!input) return errorResponse("Missing input field", 400);
    if (!env.OPENAI_API_KEY) return errorResponse("OPENAI_API_KEY not configured", 500);

    // 1. Auth / License / Free Usage Check
    const authHeader = request.headers.get("Authorization");
    const licenseKey = request.headers.get("x-license-key");
    let canProceed = false;
    let userPlan = 'free';

    // A. Check Session (Login)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const session = await verifySession(env, config.slug, token);
      if (session.valid) {
        // Logged in user
        if (session.user.plan === 'monthly' || session.user.plan === 'yearly') {
          canProceed = true; // Paid user = unlimited
          userPlan = session.user.plan;
        } else {
          // Free user logged in - still subject to limits? 
          // For now, let's say logged in free users still get IP limits or maybe slightly higher?
          // Let's stick to IP limits for free users for simplicity, or we could track usage by email.
          // To keep it simple and robust: Fallback to IP check if plan is free.
        }
      }
    }

    // B. Check License Key (Legacy / Direct)
    if (!canProceed && licenseKey) {
      const check = await checkLicense(env, licenseKey, config.slug);
      if (check.valid) {
        canProceed = true;
        userPlan = check.license.plan;
      }
    }

    // C. Free Tier Fallback
    if (!canProceed) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "unknown";
      const fingerprint = await hashString(`${ip}:${ua}`);

      const freeCheck = await checkFreeUsage(env, fingerprint, config.slug);
      if (!freeCheck.allowed) {
        return jsonResponse({
          error: "free_limit_reached",
          message: "Free limit reached. Please upgrade to continue.",
          upgrade_url: "/#pricing"
        }, 200);
      }
    }

    // 2. Prepare Prompt
    const languageNames = {
      en: "English", zh: "Chinese", es: "Spanish", fr: "French",
      de: "German", pt: "Portuguese", ja: "Japanese", ko: "Korean",
      ar: "Arabic", hi: "Hindi"
    };
    const targetLangName = languageNames[target_language] || "English";

    // Inject dynamic values into system prompt if needed, or just append instructions
    // Here we append the language instruction to the static system prompt from config
    const systemPrompt = `${config.systemPrompt}
    
IMPORTANT: Generate the content in ${targetLangName}. The tone, style, and format should match professional standards and cultural conventions of ${targetLangName}-speaking regions.
Requirements:
- Use a confident, human-sounding tone appropriate for ${targetLangName} business communication
- Personalize using the user's experience and background
- Highlight achievements and metrics when available
- Format cleanly: maximum 4 paragraphs
- Avoid generic filler content
- Include a strong, professional closing statement
- Ensure the content is written entirely in ${targetLangName} with proper grammar and cultural appropriateness`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: input }
    ];

    // 3. Call AI
    const output = await callOpenAI(env.OPENAI_API_KEY, config.model, messages);

    return jsonResponse({ output });

  } catch (error) {
    console.error("Generate error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}

// Handle /api/checkout
async function handleCheckout(request, env) {
  try {
    const { plan } = await request.json();
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return errorResponse("Invalid plan. Must be 'monthly' or 'yearly'", 400);
    }

    // Resolve Price ID from Env using Config mapping
    const envVarName = config.prices[plan]; // e.g. "STRIPE_PRICE_ID_MONTHLY"
    const priceId = env[envVarName];

    if (!priceId) {
      return errorResponse(`${envVarName} not configured`, 500);
    }

    // Create Session
    const baseUrl = env.APP_BASE_URL || 'https://yourcoverai.billyus2025.workers.dev';
    const successUrl = `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/cancel.html`;

    const session = await createCheckoutSession(env, priceId, successUrl, cancelUrl);

    return jsonResponse({ id: session.id, url: session.url });

  } catch (error) {
    console.error("Checkout error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}

// Handle /api/checkout/success
async function handleCheckoutSuccess(request, env) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return errorResponse("Missing session_id", 400);

    const session = await verifyStripeSession(env, sessionId);

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return errorResponse("Payment not completed", 400);
    }

    // Determine Plan
    let plan = 'monthly';
    const subscription = session.subscription;
    if (subscription && subscription.items && subscription.items.data[0]) {
      const priceId = subscription.items.data[0].price.id;
      // Check against Yearly Price ID
      const yearlyPriceId = env[config.prices.yearly];
      if (priceId === yearlyPriceId) {
        plan = 'yearly';
      }
    }

    // Create License
    const licenseKey = await createLicense(env, config.slug, plan);

    // If we have customer email from Stripe, link it to user account
    // Note: Stripe session object has customer_details.email
    if (session.customer_details && session.customer_details.email) {
      const email = session.customer_details.email;
      await updateUserPlan(env, config.slug, email, plan, licenseKey);
    }

    return jsonResponse({
      status: "ok",
      license: licenseKey,
      plan: plan
    });

  } catch (error) {
    console.error("Checkout success error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}

// Main Router
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const method = request.method;

      // CORS Preflight
      if (method === "OPTIONS") return handleCors();

      // Routes
      if (pathname === "/api/generate" && method === "POST") {
        return handleGenerate(request, env);
      }

      // Support both new and legacy checkout routes
      if ((pathname === "/api/checkout" || pathname === "/api/create-checkout-session" || pathname === "/create-checkout-session") && method === "POST") {
        return handleCheckout(request, env);
      }

      if ((pathname === "/api/checkout/success" || pathname === "/checkout-success") && method === "GET") {
        return handleCheckoutSuccess(request, env);
      }

      // 路由: /api/health
      if (pathname === "/api/health" && method === "GET") {
        return jsonResponse({ status: "ok", version: "1.0.0" });
      }

      // 路由: /api/license/verify
      if (pathname === "/api/license/verify" && method === "POST") {
        try {
          const { license_key } = await request.json();
          if (!license_key) return errorResponse("Missing license_key", 400);
          const check = await checkLicense(env, license_key, config.slug);
          return jsonResponse(check);
        } catch (e) {
          return errorResponse(e.message, 500);
        }
      }

      // 路由: /api/auth/send-link
      if (pathname === "/api/auth/send-link" && method === "POST") {
        const { email } = await request.json();
        if (!email) return errorResponse("Missing email", 400);
        const baseUrl = env.APP_BASE_URL || "https://yourcoverai.com";
        const link = await sendMagicLink(env, config.slug, email, baseUrl);
        return jsonResponse({ status: "ok", message: "Magic link sent", link }); // Returning link for testing
      }

      // 路由: /api/auth/verify-link
      if (pathname === "/api/auth/verify-link" && method === "POST") {
        const { token } = await request.json();
        if (!token) return errorResponse("Missing token", 400);
        const result = await verifyMagicLink(env, config.slug, token);
        if (!result.valid) return errorResponse(result.error, 401);
        return jsonResponse({ status: "ok", sessionToken: result.sessionToken, user: result.user });
      }

      // 路由: /api/auth/me
      if (pathname === "/api/auth/me" && method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) return errorResponse("Unauthorized", 401);
        const token = authHeader.split(" ")[1];
        const session = await verifySession(env, config.slug, token);
        if (!session.valid) return errorResponse("Invalid session", 401);
        return jsonResponse({ status: "ok", user: session.user });
      }

      // 404
      return errorResponse(`Route ${pathname} not found`, 404);
    } catch (err) {
      console.error("Global Worker Error:", err);
      return errorResponse(err.message || "Internal Server Error", 500);
    }
  }
};
