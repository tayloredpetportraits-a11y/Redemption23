# Deployment Guide - Netlify

This guide covers deploying your Pet Portrait Redemption Portal to Netlify with full Stripe integration.

## Prerequisites

- Netlify account connected to your Git repository
- Supabase project (already configured)
- Stripe account with API keys

## Configuration Files

The following files are configured for Netlify deployment:

### `netlify.toml`
```toml
[build]
command = "npm run build"
publish = ".next"

[[plugins]]
package = "@netlify/plugin-nextjs"
```

### `.node-version`
Specifies Node.js 18.18.0 for consistent builds.

### `package.json`
All dependencies are properly configured, including `@netlify/plugin-nextjs`.

## Environment Variables Required

### Required for ALL Deployments

Go to **Netlify Dashboard > Site Settings > Environment Variables** and add:

#### Supabase (Already Configured)
```env
NEXT_PUBLIC_SUPABASE_URL=https://opxgicxdrbpgpsxonogk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Admin Authentication
```env
ADMIN_PASSWORD=admin123
```
⚠️ **Change this in production!**

#### Stripe Integration (Required for Payments)
```env
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**For Testing:**
- Use `sk_test_...` and `pk_test_...` keys
- Configure webhook secret from Stripe CLI or test webhook endpoint

**For Production:**
- Use `sk_live_...` and `pk_live_...` keys
- Configure webhook secret from Stripe Dashboard

## Deployment Steps

### 1. Initial Deployment

Push your code to your connected Git repository:
```bash
git add .
git commit -m "Configure Netlify deployment"
git push
```

Netlify will automatically:
- Detect the Next.js application
- Install dependencies
- Run `npm run build`
- Deploy the `.next` directory
- Set up serverless functions for API routes

### 2. Configure Stripe Webhook (Critical!)

After your first deployment, you need to configure the Stripe webhook:

#### Get Your Deployed URL
Your site will be deployed to: `https://your-site-name.netlify.app`

#### Configure in Stripe Dashboard

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter URL: `https://your-site-name.netlify.app/api/webhooks/stripe`
4. Select **Latest API version**
5. Select events to listen for:
   - `checkout.session.completed` ✓
   - `checkout.session.expired` ✓
   - `payment_intent.succeeded` ✓
   - `payment_intent.payment_failed` ✓
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add it to Netlify environment variables as `STRIPE_WEBHOOK_SECRET`
9. **Trigger a redeploy** in Netlify after adding the webhook secret

### 3. Verify Deployment

After deployment completes, test the following:

#### Basic Functionality
- [ ] Homepage loads (`/`)
- [ ] Admin login page accessible (`/admin/login`)
- [ ] Customer gallery page works (`/customer/gallery/[orderId]`)

#### API Routes (check Netlify function logs)
- [ ] Order creation API responds
- [ ] Customer verification works
- [ ] Admin authentication functions

#### Stripe Integration
- [ ] Bonus theme unlock button appears
- [ ] Clicking unlock redirects to Stripe Checkout
- [ ] After test payment, user returns to gallery
- [ ] Webhook receives the event (check Stripe Dashboard)
- [ ] Database updates `bonus_unlocked` to `true`

## Build Configuration Details

### Build Command
```bash
npm run build
```
Runs `next build` which:
- Compiles TypeScript
- Bundles the application
- Optimizes images
- Generates static pages
- Creates API route handlers

### Publish Directory
```
.next
```
Contains the production build output.

### Node.js Version
```
18.18.0
```
Specified in `.node-version` file.

### Netlify Plugin
```
@netlify/plugin-nextjs
```
Automatically handles:
- Server-side rendering
- API routes as serverless functions
- Middleware execution
- Image optimization
- Incremental Static Regeneration

## Troubleshooting Common Issues

### Build Failures

**Error: "Cannot find module..."**
- **Solution:** Run `npm install` locally and commit `package-lock.json`

**Error: "Type error in..."**
- **Solution:** Run `npm run typecheck` locally to identify TypeScript errors
- Check the build logs for the specific file and line number

**Error: "Command failed: npm run build"**
- **Solution:** Verify `netlify.toml` has correct build command
- Check that all required environment variables are set
- Review Netlify build logs for specific error

### Stripe Webhook Issues

**Webhook not receiving events**
- Verify webhook URL is exactly: `https://your-site.netlify.app/api/webhooks/stripe`
- Check webhook signing secret is set in environment variables
- Trigger a redeploy after adding webhook secret
- View webhook attempts in Stripe Dashboard > Developers > Webhooks > [your endpoint]

**Webhook signature verification fails**
- Ensure `STRIPE_WEBHOOK_SECRET` matches the one in Stripe Dashboard
- Check that webhook secret starts with `whsec_`
- Verify no extra spaces in the environment variable
- Redeploy after updating the secret

**Payment succeeds but images don't unlock**
- Check Netlify function logs for `/api/webhooks/stripe`
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase logs for database update errors
- Ensure `orderId` is included in Stripe session metadata

### Database Connection Issues

**Error: "Failed to connect to Supabase"**
- Verify all three Supabase environment variables are set
- Check Supabase project is active and not paused
- Ensure URLs don't have trailing slashes
- Test connection with a simple API route

**Error: "Invalid API key"**
- Anon key is for client-side: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key is for server-side: `SUPABASE_SERVICE_ROLE_KEY`
- Don't confuse the two keys

### API Route Issues

**404 on API routes**
- API routes are automatically deployed as Netlify functions
- Check Netlify function logs for errors
- Verify the route exists in `src/app/api/`
- Check function execution in Netlify Dashboard > Functions

**Timeout errors**
- Netlify functions have a 10-second timeout on free tier
- Check for slow database queries
- Optimize external API calls
- Consider upgrading Netlify plan if needed

## Performance Optimization

### Recommendations for Production

1. **Enable Netlify Analytics**
   - Track real user performance
   - Monitor Core Web Vitals

2. **Configure Custom Domain**
   - Add custom domain in Netlify DNS settings
   - Automatic SSL certificate provisioning

3. **Set up Deploy Notifications**
   - Enable build notifications
   - Monitor deployment status

4. **Configure Deploy Previews**
   - Automatic preview deployments for PRs
   - Test changes before merging

## Environment-Specific Configuration

### Development
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe CLI)
```

### Production
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)
ADMIN_PASSWORD=<strong_password>
```

## Monitoring & Logging

### Netlify Logs

View logs at: **Netlify Dashboard > [Your Site] > Logs**

Types of logs:
- **Deploy logs**: Build output and errors
- **Function logs**: API route execution
- **Edge logs**: Middleware and routing

### Stripe Logs

View logs at: **Stripe Dashboard > Developers > Events**

Monitor:
- Webhook delivery attempts
- Payment events
- API requests

### Supabase Logs

View logs at: **Supabase Dashboard > [Your Project] > Logs**

Monitor:
- Database queries
- Connection issues
- Row Level Security policy violations

## Security Checklist

Before going live:

- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Use Stripe live keys (not test keys)
- [ ] Verify webhook signing secret is configured
- [ ] Test RLS policies in Supabase
- [ ] Enable Netlify deploy notifications
- [ ] Set up custom domain with SSL
- [ ] Review Netlify function logs for errors
- [ ] Test all payment flows in production
- [ ] Verify environment variables are all set
- [ ] Test admin authentication

## Rollback Procedure

If deployment has issues:

1. Go to **Netlify Dashboard > Deploys**
2. Find the last working deployment
3. Click **...** menu > **Publish deploy**
4. Previous version will be live immediately

## Support Resources

- **Netlify:** [docs.netlify.com](https://docs.netlify.com)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)
- **Stripe:** [stripe.com/docs](https://stripe.com/docs)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)

## Post-Deployment Checklist

- [ ] All environment variables configured in Netlify
- [ ] Stripe webhook endpoint created and secret added
- [ ] Homepage loads without errors
- [ ] Admin login works
- [ ] Customer gallery page accessible
- [ ] Bonus theme unlock redirects to Stripe
- [ ] Test payment completes successfully
- [ ] Webhook processes payment event
- [ ] Database updates after payment
- [ ] Images unlock after successful payment
- [ ] Function logs show no errors
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Deploy notifications enabled
