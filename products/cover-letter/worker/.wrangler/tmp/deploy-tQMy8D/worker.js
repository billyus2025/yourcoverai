var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../config.js
var config_default = {
  name: "AI Cover Letter Generator",
  slug: "cover-letter",
  themeColor: "#0f766e",
  model: "gpt-4o-mini",
  systemPrompt: `You are a senior HR specialist and a top-tier career coach. Your job is to generate professional, compelling, personalized cover letters that match the user's background and the job description. Use a confident, human tone. Personalize based on user experience. Highlight achievements. Max 4 paragraphs. No generic filler. Include a strong closing.`,
  prices: {
    monthly: "STRIPE_PRICE_ID_MONTHLY",
    // 对应环境变量名
    yearly: "STRIPE_PRICE_ID_YEARLY"
    // 对应环境变量名
  }
};

// ../../../shared/utils.js
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      // 允许跨域
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-license-key"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}
__name(errorResponse, "errorResponse");
function handleCors() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-license-key"
    }
  });
}
__name(handleCors, "handleCors");
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
}
__name(hashString, "hashString");
function getDateString() {
  const now = /* @__PURE__ */ new Date();
  return now.toISOString().split("T")[0];
}
__name(getDateString, "getDateString");

// ../../../shared/license.js
function generateLicenseKey() {
  return `yc_${crypto.randomUUID()}`;
}
__name(generateLicenseKey, "generateLicenseKey");
async function checkLicense(env, licenseKey, productSlug) {
  try {
    let licenseData = await env.LICENSES.get(`${productSlug}:license:${licenseKey}`);
    if (!licenseData) {
      licenseData = await env.LICENSES.get(`license:${licenseKey}`);
    }
    if (!licenseData) {
      return { valid: false, reason: "not_found" };
    }
    const license = JSON.parse(licenseData);
    if (!license.plan || !["monthly", "yearly"].includes(license.plan)) {
      return { valid: false, reason: "invalid_plan" };
    }
    license.used = (license.used || 0) + 1;
    const storageKey = await env.LICENSES.get(`${productSlug}:license:${licenseKey}`) ? `${productSlug}:license:${licenseKey}` : `license:${licenseKey}`;
    await env.LICENSES.put(storageKey, JSON.stringify(license));
    return { valid: true, license };
  } catch (error) {
    console.error("Error checking license:", error);
    return { valid: false, reason: "error" };
  }
}
__name(checkLicense, "checkLicense");
async function checkFreeUsage(env, fingerprint, productSlug) {
  const dateStr = getDateString();
  const key = `${productSlug}:free:${fingerprint}:${dateStr}`;
  try {
    const usageData = await env.FREE_USAGE.get(key);
    let usage = usageData ? JSON.parse(usageData) : { count: 0 };
    if (usage.count >= 3) {
      return { allowed: false, count: usage.count };
    }
    usage.count += 1;
    await env.FREE_USAGE.put(key, JSON.stringify(usage), { expirationTtl: 86400 });
    return { allowed: true, count: usage.count };
  } catch (error) {
    console.error("Error checking free usage:", error);
    return { allowed: true, count: 0 };
  }
}
__name(checkFreeUsage, "checkFreeUsage");
async function createLicense(env, productSlug, plan) {
  const licenseKey = generateLicenseKey();
  const licenseData = {
    plan,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    max: -1,
    // -1 表示无限
    used: 0
  };
  await env.LICENSES.put(`${productSlug}:license:${licenseKey}`, JSON.stringify(licenseData));
  return licenseKey;
}
__name(createLicense, "createLicense");

// ../../../shared/stripe.js
async function createCheckoutSession(env, priceId, successUrl, cancelUrl) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stripe API error: ${response.status} ${errorText}`);
  }
  return await response.json();
}
__name(createCheckoutSession, "createCheckoutSession");
async function verifyStripeSession(env, sessionId) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=subscription`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stripe API error: ${response.status} ${errorText}`);
  }
  return await response.json();
}
__name(verifyStripeSession, "verifyStripeSession");

// ../../../shared/openai.js
async function callOpenAI(apiKey, model, messages) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }
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
__name(callOpenAI, "callOpenAI");

// ../../../shared/auth.js
function generateToken() {
  return crypto.randomUUID();
}
__name(generateToken, "generateToken");
async function sendMagicLink(env, slug, email, baseUrl) {
  const token = generateToken();
  const expiresAt = Date.now() + 15 * 60 * 1e3;
  await env.LICENSES.put(`${slug}:auth:${token}`, JSON.stringify({ email, expiresAt }), { expirationTtl: 900 });
  const magicLink = `${baseUrl}/?token=${token}`;
  console.log(`Magic Link for ${email}: ${magicLink}`);
  return magicLink;
}
__name(sendMagicLink, "sendMagicLink");
async function verifyMagicLink(env, slug, token) {
  const key = `${slug}:auth:${token}`;
  const data = await env.LICENSES.get(key);
  if (!data) {
    return { valid: false, error: "Invalid or expired token" };
  }
  const { email, expiresAt } = JSON.parse(data);
  if (Date.now() > expiresAt) {
    return { valid: false, error: "Token expired" };
  }
  await env.LICENSES.delete(key);
  const sessionToken = generateToken();
  const sessionExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1e3;
  await env.LICENSES.put(`${slug}:session:${sessionToken}`, JSON.stringify({ email, expiresAt: sessionExpiresAt }), { expirationTtl: 604800 });
  const userKey = `${slug}:user:${email}`;
  let user = await env.LICENSES.get(userKey);
  if (!user) {
    user = { email, plan: "free", createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.LICENSES.put(userKey, JSON.stringify(user));
  } else {
    user = JSON.parse(user);
  }
  return { valid: true, sessionToken, user };
}
__name(verifyMagicLink, "verifyMagicLink");
async function verifySession(env, slug, sessionToken) {
  const key = `${slug}:session:${sessionToken}`;
  const data = await env.LICENSES.get(key);
  if (!data) {
    return { valid: false };
  }
  const { email, expiresAt } = JSON.parse(data);
  if (Date.now() > expiresAt) {
    return { valid: false };
  }
  const userKey = `${slug}:user:${email}`;
  const userData = await env.LICENSES.get(userKey);
  const user = userData ? JSON.parse(userData) : { email, plan: "free" };
  return { valid: true, email, user };
}
__name(verifySession, "verifySession");
async function updateUserPlan(env, slug, email, plan, licenseKey) {
  const userKey = `${slug}:user:${email}`;
  let user = await env.LICENSES.get(userKey);
  if (user) {
    user = JSON.parse(user);
  } else {
    user = { email, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  user.plan = plan;
  user.licenseKey = licenseKey;
  await env.LICENSES.put(userKey, JSON.stringify(user));
  return user;
}
__name(updateUserPlan, "updateUserPlan");

// worker.js
async function handleGenerate(request, env) {
  try {
    const { input, target_language = "en" } = await request.json();
    if (!input) return errorResponse("Missing input field", 400);
    if (!env.OPENAI_API_KEY) return errorResponse("OPENAI_API_KEY not configured", 500);
    const authHeader = request.headers.get("Authorization");
    const licenseKey = request.headers.get("x-license-key");
    let canProceed = false;
    let userPlan = "free";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const session = await verifySession(env, config_default.slug, token);
      if (session.valid) {
        if (session.user.plan === "monthly" || session.user.plan === "yearly") {
          canProceed = true;
          userPlan = session.user.plan;
        } else {
        }
      }
    }
    if (!canProceed && licenseKey) {
      const check = await checkLicense(env, licenseKey, config_default.slug);
      if (check.valid) {
        canProceed = true;
        userPlan = check.license.plan;
      }
    }
    if (!canProceed) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "unknown";
      const fingerprint = await hashString(`${ip}:${ua}`);
      const freeCheck = await checkFreeUsage(env, fingerprint, config_default.slug);
      if (!freeCheck.allowed) {
        return jsonResponse({
          error: "free_limit_reached",
          message: "Free limit reached. Please upgrade to continue.",
          upgrade_url: "/#pricing"
        }, 200);
      }
    }
    const languageNames = {
      en: "English",
      zh: "Chinese",
      es: "Spanish",
      fr: "French",
      de: "German",
      pt: "Portuguese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
      hi: "Hindi"
    };
    const targetLangName = languageNames[target_language] || "English";
    const systemPrompt = `${config_default.systemPrompt}
    
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
    const output = await callOpenAI(env.OPENAI_API_KEY, config_default.model, messages);
    return jsonResponse({ output });
  } catch (error) {
    console.error("Generate error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}
__name(handleGenerate, "handleGenerate");
async function handleCheckout(request, env) {
  try {
    const { plan } = await request.json();
    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return errorResponse("Invalid plan. Must be 'monthly' or 'yearly'", 400);
    }
    const envVarName = config_default.prices[plan];
    const priceId = env[envVarName];
    if (!priceId) {
      return errorResponse(`${envVarName} not configured`, 500);
    }
    const baseUrl = env.APP_BASE_URL || "https://yourcoverai.billyus2025.workers.dev";
    const successUrl = `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/cancel.html`;
    const session = await createCheckoutSession(env, priceId, successUrl, cancelUrl);
    return jsonResponse({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}
__name(handleCheckout, "handleCheckout");
async function handleCheckoutSuccess(request, env) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) return errorResponse("Missing session_id", 400);
    const session = await verifyStripeSession(env, sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return errorResponse("Payment not completed", 400);
    }
    let plan = "monthly";
    const subscription = session.subscription;
    if (subscription && subscription.items && subscription.items.data[0]) {
      const priceId = subscription.items.data[0].price.id;
      const yearlyPriceId = env[config_default.prices.yearly];
      if (priceId === yearlyPriceId) {
        plan = "yearly";
      }
    }
    const licenseKey = await createLicense(env, config_default.slug, plan);
    if (session.customer_details && session.customer_details.email) {
      const email = session.customer_details.email;
      await updateUserPlan(env, config_default.slug, email, plan, licenseKey);
    }
    return jsonResponse({
      status: "ok",
      license: licenseKey,
      plan
    });
  } catch (error) {
    console.error("Checkout success error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}
__name(handleCheckoutSuccess, "handleCheckoutSuccess");
var worker_default = {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const method = request.method;
      if (method === "OPTIONS") return handleCors();
      if (pathname === "/api/generate" && method === "POST") {
        return handleGenerate(request, env);
      }
      if ((pathname === "/api/checkout" || pathname === "/api/create-checkout-session" || pathname === "/create-checkout-session") && method === "POST") {
        return handleCheckout(request, env);
      }
      if ((pathname === "/api/checkout/success" || pathname === "/checkout-success") && method === "GET") {
        return handleCheckoutSuccess(request, env);
      }
      if (pathname === "/api/health" && method === "GET") {
        return jsonResponse({ status: "ok", version: "1.0.0" });
      }
      if (pathname === "/api/license/verify" && method === "POST") {
        try {
          const { license_key } = await request.json();
          if (!license_key) return errorResponse("Missing license_key", 400);
          const check = await checkLicense(env, license_key, config_default.slug);
          return jsonResponse(check);
        } catch (e) {
          return errorResponse(e.message, 500);
        }
      }
      if (pathname === "/api/auth/send-link" && method === "POST") {
        const { email } = await request.json();
        if (!email) return errorResponse("Missing email", 400);
        const baseUrl = env.APP_BASE_URL || "https://yourcoverai.com";
        const link = await sendMagicLink(env, config_default.slug, email, baseUrl);
        return jsonResponse({ status: "ok", message: "Magic link sent", link });
      }
      if (pathname === "/api/auth/verify-link" && method === "POST") {
        const { token } = await request.json();
        if (!token) return errorResponse("Missing token", 400);
        const result = await verifyMagicLink(env, config_default.slug, token);
        if (!result.valid) return errorResponse(result.error, 401);
        return jsonResponse({ status: "ok", sessionToken: result.sessionToken, user: result.user });
      }
      if (pathname === "/api/auth/me" && method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) return errorResponse("Unauthorized", 401);
        const token = authHeader.split(" ")[1];
        const session = await verifySession(env, config_default.slug, token);
        if (!session.valid) return errorResponse("Invalid session", 401);
        return jsonResponse({ status: "ok", user: session.user });
      }
      return errorResponse(`Route ${pathname} not found`, 404);
    } catch (err) {
      console.error("Global Worker Error:", err);
      return errorResponse(err.message || "Internal Server Error", 500);
    }
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
