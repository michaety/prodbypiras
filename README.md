# SaaS Admin Template

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/saas-admin-template)

![SaaS Admin Template](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/52b88668-0144-489c-dd02-fe620270ba00/public)

<!-- dash-content-start -->

A complete admin dashboard template built with Astro, Shadcn UI, and Cloudflare's developer stack. Quickly deploy a fully functional admin interface with customer and subscription management capabilities.

## Features

- 🎨 Modern UI built with Astro and Shadcn UI
- 🔐 Built-in API with token authentication
- 👥 Customer management
- 💳 Subscription tracking
- 🛒 E-commerce shop with Stripe integration
- 🖼️ Automatic image conversion to WebP format
- 🎵 Audio preview support with proper MIME types
- 🚀 Deploy to Cloudflare Workers
- 📦 Powered by Cloudflare D1 database
- 💾 File storage with Cloudflare R2
- ✨ Clean, responsive interface
- 🔍 Data validation with Zod

## Tech Stack

- Frontend: [Astro](https://astro.build)
- UI Components: [Shadcn UI](https://ui.shadcn.com)
- Database: [Cloudflare D1](https://developers.cloudflare.com/d1)
- Deployment: [Cloudflare Workers](https://workers.cloudflare.com)
- Validation: [Zod](https://github.com/colinhacks/zod)

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/d1-template#setup-steps) before deploying.

<!-- dash-content-end -->

## Setup Steps

1. Install dependencies:

```bash
npm install
```

2. Set up your environment variables:

```bash
# Create a .dev.vars file for local development
cp .dev.vars.example .dev.vars
```

Add your API token and Stripe secret key:

```
API_TOKEN=your_token_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```

_An API token is required to authenticate requests to the API. You should generate this before trying to run the project locally or deploying it._

_For Stripe integration: Get your Stripe secret key from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys). Use test keys (starting with `sk_test_`) for development and live keys (starting with `sk_live_`) for production._

3. Create a [D1 database](https://developers.cloudflare.com/d1/get-started/) with the name "admin-db":

```bash
npx wrangler d1 create admin-db
```

...and update the `database_id` field in `wrangler.json` with the new database ID.

4. Run the database migrations locally:

```bash
$ npm run db:migrate
```

Run the development server:

```bash
npm run dev
```

_If you're testing Workflows, you should run `npm run wrangler:dev` instead._

5. Build the application:

```bash
npm run build
```

6. Deploy to Cloudflare Workers:

```bash
npm run deploy
```

7. Run the database migrations remotely:

```bash
$ npm run db:migrate:remote
```

8. Set your production secrets:

```bash
# Set API token
npx wrangler secret put API_TOKEN

# Set Stripe secret key for production payments
npx wrangler secret put STRIPE_SECRET_KEY

# Set Stripe webhook secret (get from Stripe Dashboard → Webhooks)
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Stripe Payments Integration

This project includes a complete Stripe integration using hosted domains (no custom domain setup required):

- **Checkout**: Single-item and cart purchases redirect to `checkout.stripe.com`
- **Payment Links**: Generate shareable links on `buy.stripe.com` for products
- **Customer Portal**: Subscription management on `billing.stripe.com`
- **Webhooks**: Automatic database updates when payments complete

### Quick Setup

1. Follow the [Quick Start Guide](STRIPE_QUICK_START.md) for 5-minute setup
2. Set environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
3. Apply database migration: `npm run db:migrate:remote`
4. Configure webhook in Stripe Dashboard
5. Deploy and test

See [STRIPE_HOSTED_SETUP.md](STRIPE_HOSTED_SETUP.md) for detailed setup instructions and [STRIPE_INTEGRATION_SUMMARY.md](STRIPE_INTEGRATION_SUMMARY.md) for architecture details.

## Usage

This project includes a fully functional admin dashboard with customer and subscription management capabilities. It also includes an API with token authentication to access resources via REST, returning JSON data.

It also includes a "Customer Workflow", built with [Cloudflare Workflows](https://developers.cloudflare.com/workflows). This workflow can be triggered in the UI or via the REST API to do arbitrary actions in the background for any given user. See [`customer_workflow.ts`]() to learn more about what you can do in this workflow.
