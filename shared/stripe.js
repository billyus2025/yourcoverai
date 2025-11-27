// Stripe 支付逻辑 (Shared Stripe Logic)

/**
 * 创建 Stripe Checkout Session
 * @param {Object} env - Cloudflare Env
 * @param {string} priceId - Stripe Price ID
 * @param {string} successUrl - 成功回调 URL
 * @param {string} cancelUrl - 取消回调 URL
 * @returns {Promise<Object>} { id, url }
 */
export async function createCheckoutSession(env, priceId, successUrl, cancelUrl) {
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY not configured");
    }

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

/**
 * 验证 Stripe Session 并获取订阅信息
 * @param {Object} env - Cloudflare Env
 * @param {string} sessionId - Stripe Session ID
 * @returns {Promise<Object>} Session Object
 */
export async function verifyStripeSession(env, sessionId) {
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY not configured");
    }

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

    return await response.json();
}
