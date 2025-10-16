# Custom Domain Setup Guide (hevin.dev)

This guide explains how to set up a custom domain (hevin.dev) for your Cloudflare Workers application and ensure Stripe checkout works correctly.

## Prerequisites

- A custom domain (e.g., hevin.dev) registered with a domain registrar
- Access to your Cloudflare dashboard
- Your application deployed to Cloudflare Workers

## Step 1: Add Domain to Cloudflare

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Add a Site** (if domain not already on Cloudflare)
3. Enter your domain name (e.g., hevin.dev)
4. Select a plan (Free plan works fine)
5. Follow the instructions to update your domain's nameservers at your registrar to point to Cloudflare

## Step 2: Wait for DNS Propagation

After updating nameservers:
- Cloudflare will verify the nameserver change (can take up to 24 hours)
- Check status in Cloudflare Dashboard under **Overview** → **Status**
- Look for "Active" status before proceeding

## Step 3: Configure Custom Domain for Workers

### Option A: Using Cloudflare Dashboard

1. Go to **Workers & Pages** in your Cloudflare Dashboard
2. Select your deployed application (prodbypiras)
3. Go to **Settings** → **Domains & Routes**
4. Click **Add Custom Domain**
5. Enter your domain: `hevin.dev`
6. Click **Add domain**
7. Cloudflare will automatically create the necessary DNS records

### Option B: Using Wrangler CLI

```bash
npx wrangler deploy --route hevin.dev/*
```

## Step 4: Add DNS Records (If Not Auto-Created)

If DNS records weren't automatically created:

1. Go to **DNS** → **Records** in Cloudflare Dashboard
2. Add a CNAME record:
   - **Type**: CNAME
   - **Name**: @ (or your subdomain, e.g., www)
   - **Target**: prodbypiras.michaety.workers.dev
   - **Proxy status**: Proxied (orange cloud)
   - **TTL**: Auto

For subdomain (www.hevin.dev):
- **Type**: CNAME
- **Name**: www
- **Target**: hevin.dev
- **Proxy status**: Proxied
- **TTL**: Auto

## Step 5: Verify Domain is Active

### Check DNS Propagation

```bash
# Check DNS resolution
nslookup hevin.dev

# Or use online tools
# https://www.whatsmydns.net/#CNAME/hevin.dev
```

### Test Your Application

1. Visit https://hevin.dev in a browser
2. You should see your application homepage
3. Try navigating to https://hevin.dev/shop
4. Test the checkout flow

## Step 6: Update Environment Variables (Optional)

If you want to force using the custom domain in your application:

```bash
# Set site URL environment variable
npx wrangler secret put SITE_URL
# Enter: https://hevin.dev
```

Or add to Cloudflare Dashboard:
1. **Workers & Pages** → Select your app
2. **Settings** → **Variables and Secrets**
3. Add variable: `SITE_URL` = `https://hevin.dev`

## How Stripe Checkout URLs Work

The application now uses **dynamic URL detection**:

```typescript
// Uses the origin from the current request
const baseUrl = url.origin; // e.g., https://hevin.dev or https://prodbypiras.michaety.workers.dev

// Stripe receives valid URLs regardless of which domain is used
success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`
cancel_url: `${baseUrl}/cancel`
```

This means:
- ✅ Works on Workers URL: prodbypiras.michaety.workers.dev
- ✅ Works on custom domain: hevin.dev
- ✅ Works on any configured domain automatically
- ✅ No hardcoded URLs that can break

## Troubleshooting

### Domain Shows "DNS_PROBE_FINISHED_NXDOMAIN"

**Problem**: DNS records not propagated or incorrect.

**Solution**:
1. Wait 5-10 minutes for DNS propagation
2. Clear browser cache and DNS cache:
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache`
   - Linux: `sudo systemd-resolve --flush-caches`
3. Verify nameservers are pointed to Cloudflare

### Stripe Checkout Shows "Not a valid URL" Error

**Problem**: Application is being accessed via an unconfigured URL.

**Solution**:
1. Ensure you're accessing via configured domain (hevin.dev) or Workers URL
2. Check Cloudflare Dashboard → **Workers & Pages** → **Settings** → **Domains & Routes**
3. Verify domain is listed and active
4. Check browser console for actual error messages

### "SSL_ERROR_BAD_CERT_DOMAIN" or Certificate Errors

**Problem**: SSL certificate not yet issued for custom domain.

**Solution**:
1. Wait 5-15 minutes for Cloudflare to issue SSL certificate
2. Certificate is automatically provisioned when domain is added
3. Check **SSL/TLS** → **Edge Certificates** in Cloudflare Dashboard
4. Ensure SSL/TLS encryption mode is "Flexible" or "Full"

### Application Loads But Checkout Fails

**Problem**: Environment variables not set in production.

**Solution**:
1. Verify `STRIPE_SECRET_KEY` is set in Cloudflare Dashboard
2. Check **Workers & Pages** → **Settings** → **Variables and Secrets**
3. Ensure key starts with `sk_test_` (test) or `sk_live_` (production)
4. Regenerate key if expired: https://dashboard.stripe.com/apikeys

### Workers URL Still Works, Want to Redirect

**Problem**: Want all traffic to use custom domain only.

**Solution**: Add a redirect in your middleware or create a Worker route:

```typescript
// In src/middleware.ts or similar
if (url.hostname.includes('workers.dev')) {
  return Response.redirect(`https://hevin.dev${url.pathname}`, 301);
}
```

## Verification Checklist

Before considering the setup complete, verify:

- [ ] Domain resolves correctly (nslookup/dig)
- [ ] Application loads at https://hevin.dev
- [ ] SSL certificate is valid (no browser warnings)
- [ ] Shop page loads and displays items
- [ ] Single item "Buy Now" redirects to Stripe
- [ ] Cart functionality works (add items, view cart)
- [ ] Cart checkout redirects to Stripe
- [ ] Success page displays after test payment
- [ ] Cancel page displays when checkout cancelled
- [ ] No console errors related to URLs

## Additional Resources

- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Stripe Checkout URLs](https://stripe.com/docs/payments/checkout/custom-success-page)
- [DNS Propagation Checker](https://www.whatsmydns.net/)

## Support

If issues persist:
1. Check Cloudflare Workers logs in dashboard
2. Enable browser Developer Tools → Console
3. Review Stripe Dashboard → **Logs** for API errors
4. Verify all environment variables are set correctly
