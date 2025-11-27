// Authentication Logic (Shared)
import { jsonResponse, errorResponse, getDateString } from "./utils.js";

/**
 * Generate a random token
 */
function generateToken() {
    return crypto.randomUUID();
}

/**
 * Send Magic Link (Mock for now)
 * Stores token in KV and returns the link.
 * @param {Object} env 
 * @param {string} slug 
 * @param {string} email 
 * @param {string} baseUrl 
 */
export async function sendMagicLink(env, slug, email, baseUrl) {
    const token = generateToken();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    // Store auth token: [slug]:auth:[token]
    await env.LICENSES.put(`${slug}:auth:${token}`, JSON.stringify({ email, expiresAt }), { expirationTtl: 900 });

    // In a real app, send email here.
    // For now, return the link.
    const magicLink = `${baseUrl}/?token=${token}`;

    console.log(`Magic Link for ${email}: ${magicLink}`);
    return magicLink;
}

/**
 * Verify Magic Link Token
 * @param {Object} env 
 * @param {string} slug 
 * @param {string} token 
 */
export async function verifyMagicLink(env, slug, token) {
    const key = `${slug}:auth:${token}`;
    const data = await env.LICENSES.get(key);

    if (!data) {
        return { valid: false, error: "Invalid or expired token" };
    }

    const { email, expiresAt } = JSON.parse(data);
    if (Date.now() > expiresAt) {
        return { valid: false, error: "Token expired" };
    }

    // Delete used token
    await env.LICENSES.delete(key);

    // Create Session
    const sessionToken = generateToken();
    const sessionExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Store session: [slug]:session:[token]
    await env.LICENSES.put(`${slug}:session:${sessionToken}`, JSON.stringify({ email, expiresAt: sessionExpiresAt }), { expirationTtl: 604800 });

    // Get or Create User Profile
    const userKey = `${slug}:user:${email}`;
    let user = await env.LICENSES.get(userKey);

    if (!user) {
        user = { email, plan: 'free', createdAt: new Date().toISOString() };
        await env.LICENSES.put(userKey, JSON.stringify(user));
    } else {
        user = JSON.parse(user);
    }

    return { valid: true, sessionToken, user };
}

/**
 * Verify Session Token
 * @param {Object} env 
 * @param {string} slug 
 * @param {string} sessionToken 
 */
export async function verifySession(env, slug, sessionToken) {
    const key = `${slug}:session:${sessionToken}`;
    const data = await env.LICENSES.get(key);

    if (!data) {
        return { valid: false };
    }

    const { email, expiresAt } = JSON.parse(data);
    if (Date.now() > expiresAt) {
        return { valid: false };
    }

    // Get User Profile to check plan
    const userKey = `${slug}:user:${email}`;
    const userData = await env.LICENSES.get(userKey);
    const user = userData ? JSON.parse(userData) : { email, plan: 'free' };

    return { valid: true, email, user };
}

/**
 * Update User Plan (e.g. after Stripe payment)
 * @param {Object} env 
 * @param {string} slug 
 * @param {string} email 
 * @param {string} plan 
 * @param {string} licenseKey 
 */
export async function updateUserPlan(env, slug, email, plan, licenseKey) {
    const userKey = `${slug}:user:${email}`;
    let user = await env.LICENSES.get(userKey);

    if (user) {
        user = JSON.parse(user);
    } else {
        user = { email, createdAt: new Date().toISOString() };
    }

    user.plan = plan;
    user.licenseKey = licenseKey;

    await env.LICENSES.put(userKey, JSON.stringify(user));
    return user;
}
