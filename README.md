# SKYSEED AI Product Factory (V1)

Usage example:

node factory-engine/create-product.js "AI Cover Letter" cover-letter "#0f766e" "You are a professional coach..."

## Billing (Stripe) Setup

YourCoverAI includes a complete Stripe subscription system. See [STRIPE_SETUP.md](products/cover-letter/worker/STRIPE_SETUP.md) for detailed setup instructions.

### Quick Setup

1. **Create Stripe Account**: Sign up at https://stripe.com
2. **Create Products**:
   - Monthly: $9.9/month
   - Yearly: $79/year
3. **Get Price IDs**: Copy price IDs from Stripe Dashboard
4. **Configure Worker Secrets**:
   ```bash
   cd products/cover-letter/worker
   npx wrangler secret put STRIPE_SECRET_KEY
   npx wrangler secret put STRIPE_PRICE_MONTHLY
   npx wrangler secret put STRIPE_PRICE_YEARLY
   npx wrangler secret put APP_BASE_URL
   ```
5. **Deploy**: `npx wrangler deploy`

### Features

- **Free Tier**: 3 generations per day (tracked by IP fingerprint)
- **Pro Subscription**: Unlimited generations via License Key
- **License-based**: No complex user accounts, simple License Key system
- **KV Storage**: Uses Cloudflare KV for license and usage tracking

### API Endpoints

- `POST /api/generate` - Generate cover letter (with free/paid checks)
- `POST /api/checkout` - Create Stripe Checkout Session
- `GET /api/checkout/success` - Activate license after payment

See [STRIPE_SETUP.md](products/cover-letter/worker/STRIPE_SETUP.md) for full API documentation.

