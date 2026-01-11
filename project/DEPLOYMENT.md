# Deployment Guide

This guide covers deploying your Pet Portrait Redemption Portal.

## Prerequisites

- Hosting account (Vercel recommended) connected to your Git repository
- Supabase project (already configured)
- Stripe account with API keys

## Environment Variables

These must be set in your hosting provider's project settings.

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://opxgicxdrbpgpsxonogk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=... (Your Anon Key)
SUPABASE_SERVICE_ROLE_KEY=... (Your Service Role Key)
```

### Admin Authentication
```env
ADMIN_PASSWORD=... (Set a strong password)
```

### Stripe Integration
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Deployment Steps (Vercel)

1. **Commit Changes**: Ensure all changes are committed to your git repository.
2. **Push to Git**: Push your changes to the branch connected to Vercel (usually `main`).
3. **Vercel Auto-Deploy**: Vercel should automatically detect the Next.js app and build it.

## Manual Deployment (CLI)

If you prefer to deploy from your terminal:

```bash
npx vercel
```

Follow the prompts to link your project and deploy.

## Post-Deployment Verification

- Check that the admin login works: `/admin/login`
- Verify image generation and redemption flow.
- Ensure Stripe webhooks are firing correctly (update the webhook URL in Stripe Dashboard to your new domain: `https://your-domain.com/api/webhooks/stripe`).
