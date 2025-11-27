# Stripe Billing Setup Guide

## Overview

YourCoverAI uses Stripe for subscription payments. This guide explains how to set up Stripe integration.

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Cloudflare Worker with KV namespaces configured
3. Access to Cloudflare Dashboard

## Step 1: Create Stripe Products and Prices

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Products** → **Add Product**

### Create Monthly Subscription

- **Name**: YourCoverAI Pro Monthly
- **Description**: Unlimited cover letter generation
- **Pricing Model**: Recurring
- **Price**: $9.90 USD
- **Billing Period**: Monthly
- **Copy the Price ID** (starts with `price_...`)

### Create Yearly Subscription

- **Name**: YourCoverAI Pro Yearly
- **Description**: Unlimited cover letter generation
- **Pricing Model**: Recurring
- **Price**: $79.00 USD
- **Billing Period**: Yearly
- **Copy the Price ID** (starts with `price_...`)

## Step 2: Get Stripe Secret Key

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Secret key** (starts with `sk_...`)
   - Use **Test mode** key for development
   - Use **Live mode** key for production

## Step 3: Configure Cloudflare Worker Environment Variables

In Cloudflare Dashboard or using Wrangler CLI:

### Required Environment Variables

```bash
# Set as Worker Secrets
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_PRICE_MONTHLY
npx wrangler secret put STRIPE_PRICE_YEARLY
npx wrangler secret put APP_BASE_URL
```

Or set in Cloudflare Dashboard:
1. Go to Workers & Pages → yourcoverai
2. Settings → Variables and Secrets
3. Add each secret:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_PRICE_MONTHLY`: Monthly price ID (e.g., `price_xxxxx`)
   - `STRIPE_PRICE_YEARLY`: Yearly price ID (e.g., `price_xxxxx`)
   - `APP_BASE_URL`: Your app URL (e.g., `https://yourcoverai.com`)

## Step 4: Verify KV Namespaces

The KV namespaces should already be configured in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "LICENSES"
id = "99176a33bd1f4293be4380fe7c425ac7"

[[kv_namespaces]]
binding = "FREE_USAGE"
id = "737d6c4e60e14a19bd16f7fab83b68e4"
```

If you need to create new namespaces:

```bash
npx wrangler kv namespace create LICENSES
npx wrangler kv namespace create FREE_USAGE
```

Then update `wrangler.toml` with the returned IDs.

## Step 5: Deploy Worker

```bash
cd products/cover-letter/worker
npx wrangler deploy
```

## Testing

### Test Mode

1. Use Stripe test mode keys
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date, any CVC

### Production

1. Switch to live mode keys
2. Update `APP_BASE_URL` to production domain
3. Redeploy Worker

## API Endpoints

### POST /api/checkout

Create Stripe Checkout Session.

**Request**:
```json
{
  "plan": "monthly" | "yearly"
}
```

**Response**:
```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### GET /api/checkout/success

Activate license after successful payment.

**Query Parameters**:
- `session_id`: Stripe Checkout Session ID

**Response**:
```json
{
  "status": "ok",
  "license": "abc123...",
  "plan": "monthly"
}
```

### POST /api/generate

Generate cover letter (with license check).

**Headers**:
- `x-license-key` (optional): License key for paid users

**Request**:
```json
{
  "input": "Job description...",
  "target_language": "en"
}
```

**Response (Success)**:
```json
{
  "output": "Generated cover letter..."
}
```

**Response (Free Limit Reached)**:
```json
{
  "error": "free_limit_reached",
  "message": "Free limit reached. Please upgrade to continue.",
  "upgrade_url": "https://yourcoverai.com/pricing.html"
}
```

## Troubleshooting

### "STRIPE_SECRET_KEY not configured"
- Verify secret is set: `npx wrangler secret list`
- Re-set if needed: `npx wrangler secret put STRIPE_SECRET_KEY`

### "Invalid price ID"
- Verify price IDs in Stripe Dashboard
- Ensure using correct test/live mode keys

### License not activating
- Check Stripe session status in Dashboard
- Verify `APP_BASE_URL` matches your domain
- Check Worker logs: `npx wrangler tail`

### Free limit not working
- Verify KV namespace binding in `wrangler.toml`
- Check KV namespace exists: `npx wrangler kv namespace list`

## Security Notes

- Never commit Stripe keys to git
- Always use Worker Secrets for sensitive data
- Use test mode for development
- Monitor Stripe Dashboard for suspicious activity

