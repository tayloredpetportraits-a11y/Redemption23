# GitHub Export & Manual Netlify Deployment Guide

This guide will walk you through exporting your project to GitHub and deploying it manually to Netlify with full control over environment variables and build settings.

## Part 1: Export to GitHub

### Step 1: Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the **+** icon in the top right > **New repository**
3. Name your repository (e.g., `pet-portrait-redemption`)
4. Choose **Private** or **Public**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Step 2: Download Project Files

In Bolt.new:
1. Click the **Download** button in the top right corner
2. This will download all project files as a ZIP
3. Extract the ZIP to a folder on your computer

Alternatively, if you're already in a terminal with the project:
```bash
# Copy the entire project directory to your desired location
cp -r /tmp/cc-agent/61963850/project /path/to/your/local/folder
cd /path/to/your/local/folder
```

### Step 3: Initialize Git and Push to GitHub

Open a terminal in your project folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Pet Portrait Redemption Portal"

# Add your GitHub repository as remote
# Replace YOUR_USERNAME and YOUR_REPO with your actual values
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Verify Files on GitHub

Check that all files are uploaded:
- ✓ `src/` directory with all components
- ✓ `supabase/` directory with migrations
- ✓ `package.json`
- ✓ `netlify.toml`
- ✓ `.env.example` (but NOT `.env`)
- ✓ `next.config.js`
- ✓ All other configuration files

**IMPORTANT:** Verify that `.env` is NOT uploaded (it should be ignored by .gitignore)

---

## Part 2: Deploy to Netlify

### Step 1: Connect Repository to Netlify

1. Go to [Netlify](https://app.netlify.com) and log in
2. Click **Add new site** > **Import an existing project**
3. Choose **GitHub** as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your repository from the list

### Step 2: Configure Build Settings

Netlify should auto-detect the settings from `netlify.toml`, but verify:

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `18.18.0` (from `.node-version`)

Click **Show advanced** if you need to customize anything.

### Step 3: Set Environment Variables (CRITICAL!)

Before deploying, you MUST add all environment variables.

Click **Add environment variables** and add each of these:

#### Supabase Variables (3 required)

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://opxgicxdrbpgpsxonogk.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9weGdpY3hkcmJwZ3BzeG9ub2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDQ4MDksImV4cCI6MjA4MjUyMDgwOX0.ee2cA6uq5LfRrcGUQmDKlHQiW4lLjXH_6fB0EWdumZw
```

```
SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9weGdpY3hkcmJwZ3BzeG9ub2drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0NDgwOSwiZXhwIjoyMDgyNTIwODA5fQ.xJfnUr-wTdYdP3nQHZQxqmTy_qVbNzWPZw1o7i02rnQ
```

#### Admin Password (1 required)

```
ADMIN_PASSWORD
Value: admin123
```
⚠️ **Change this to a strong password for production!**

#### Stripe Variables (3 required for payments)

```
STRIPE_SECRET_KEY
Value: sk_test_your_test_key_here
```
(Get from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys))

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_your_test_key_here
```
(Get from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys))

```
STRIPE_WEBHOOK_SECRET
Value: Leave empty for now (add after deployment)
```

### Step 4: Deploy Site

1. Click **Deploy site**
2. Netlify will:
   - Clone your repository
   - Install dependencies
   - Run `npm run build`
   - Deploy the site
3. Wait for build to complete (usually 2-5 minutes)
4. You'll get a URL like: `https://random-name-12345.netlify.app`

### Step 5: Configure Stripe Webhook (CRITICAL!)

This step is required for bonus theme payments to work.

#### Get Your Deployed URL
Copy your Netlify URL from the dashboard (e.g., `https://your-site.netlify.app`)

#### Set Up Webhook in Stripe

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Enter endpoint URL:
   ```
   https://your-site.netlify.app/api/webhooks/stripe
   ```
   (Replace `your-site` with your actual Netlify subdomain)
4. Select **Latest API version**
5. Click **Select events** and choose:
   - ✓ `checkout.session.completed`
   - ✓ `checkout.session.expired`
   - ✓ `payment_intent.succeeded`
   - ✓ `payment_intent.payment_failed`
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)

#### Add Webhook Secret to Netlify

1. Go back to Netlify Dashboard
2. Go to **Site settings > Environment variables**
3. Click **Add a variable**
4. Add:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (paste the signing secret from Stripe)
5. Click **Save**
6. **Trigger a redeploy:**
   - Go to **Deploys** tab
   - Click **Trigger deploy** > **Deploy site**

---

## Part 3: Verification & Testing

### Test Basic Functionality

1. **Homepage**
   - Visit your site: `https://your-site.netlify.app`
   - Should load without errors

2. **Admin Login**
   - Go to: `https://your-site.netlify.app/admin/login`
   - Login with your `ADMIN_PASSWORD`
   - Should redirect to admin dashboard

3. **Customer Gallery**
   - Visit: `https://your-site.netlify.app/customer/gallery/test-order-id`
   - Should show gallery interface

### Test Stripe Payment Flow

1. **Unlock Bonus Theme**
   - In customer gallery, click **"Unlock Bonus Portraits"**
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete payment

2. **Verify Success**
   - Should redirect back to gallery
   - Should see success message with confetti
   - Bonus images should be unlocked
   - Can download all images

3. **Check Backend**
   - Netlify: **Functions** tab > Check logs for webhook execution
   - Stripe: **Developers > Events** > Verify event was sent
   - Supabase: Check `orders` table > Verify `bonus_unlocked = true`

---

## Part 4: Custom Domain (Optional)

### Add Custom Domain

1. In Netlify Dashboard, go to **Domain settings**
2. Click **Add custom domain**
3. Enter your domain (e.g., `mysite.com`)
4. Follow DNS configuration instructions
5. Netlify will automatically provision SSL certificate

### Update Stripe Webhook URL

After adding custom domain:
1. Go to Stripe Dashboard > Webhooks
2. Edit your webhook endpoint
3. Update URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Save changes

---

## Part 5: Monitoring & Maintenance

### Monitor Build Status

**Netlify Dashboard > Deploys**
- Green checkmark = successful
- Red X = failed (click to see logs)

### Monitor Function Logs

**Netlify Dashboard > Functions**
- View real-time function executions
- Check for errors in API routes
- Monitor webhook processing

### Monitor Stripe Events

**Stripe Dashboard > Developers > Events**
- View all payment events
- Check webhook delivery status
- Debug failed webhooks

### Monitor Database

**Supabase Dashboard > Logs**
- View database queries
- Check for connection issues
- Monitor RLS policy violations

---

## Troubleshooting

### Build Fails with "Cannot find module"

**Solution:**
```bash
# In your local project
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

### Build Fails with TypeScript Errors

**Solution:**
```bash
# Run locally to see errors
npm run typecheck

# Fix the errors in your code
# Then commit and push
git add .
git commit -m "Fix TypeScript errors"
git push
```

### Environment Variables Not Working

**Checklist:**
- [ ] All variables added in Netlify Dashboard
- [ ] Variable names match exactly (case-sensitive)
- [ ] No extra spaces in values
- [ ] Redeployed after adding variables
- [ ] Variables starting with `NEXT_PUBLIC_` are accessible in browser

### Webhook Not Receiving Events

**Checklist:**
- [ ] Webhook URL matches deployed site exactly
- [ ] No typos in URL path `/api/webhooks/stripe`
- [ ] `STRIPE_WEBHOOK_SECRET` set in Netlify
- [ ] Redeployed after adding webhook secret
- [ ] Check Stripe Dashboard > Events for delivery attempts

### Database Connection Issues

**Checklist:**
- [ ] All 3 Supabase env vars are set
- [ ] URLs don't have trailing slashes
- [ ] Keys are copied completely (they're very long)
- [ ] Supabase project is active (not paused)

### 404 on Admin Pages

**Cause:** Middleware not executing properly

**Solution:**
- Check `src/middleware.ts` exists
- Verify `next.config.js` is configured correctly
- Clear Netlify cache and redeploy

---

## Environment Variable Reference

Quick copy-paste reference for Netlify:

### Required Variables (7 total)

| Variable Name | Where to Get | Notes |
|--------------|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Service role key |
| `ADMIN_PASSWORD` | Set your own | Change from default! |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Test or Live key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Test or Live key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Settings | Add after deployment |

---

## Quick Commands Reference

### Local Development
```bash
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Test build locally
npm run typecheck   # Check for TypeScript errors
npm run lint        # Run ESLint
```

### Git Operations
```bash
git status                    # Check what changed
git add .                     # Stage all changes
git commit -m "message"       # Commit changes
git push                      # Push to GitHub
git log --oneline             # View commit history
```

### Netlify CLI (Optional)
```bash
npm install -g netlify-cli    # Install Netlify CLI
netlify login                 # Login to Netlify
netlify deploy --prod         # Deploy manually
netlify env:list              # List environment variables
netlify functions:log         # View function logs
```

---

## Production Checklist

Before going live with real customers:

- [ ] Change `ADMIN_PASSWORD` to strong password
- [ ] Switch to Stripe live keys (not test)
- [ ] Update webhook to use live endpoint
- [ ] Set up custom domain with SSL
- [ ] Test complete payment flow with live card
- [ ] Enable Netlify Analytics
- [ ] Set up deploy notifications
- [ ] Configure error monitoring (e.g., Sentry)
- [ ] Test on multiple devices/browsers
- [ ] Verify all environment variables in production
- [ ] Review Supabase RLS policies
- [ ] Set up database backups in Supabase
- [ ] Create rollback plan

---

## Support & Resources

- **Netlify Docs:** https://docs.netlify.com
- **Next.js Docs:** https://nextjs.org/docs
- **Stripe Docs:** https://stripe.com/docs/webhooks
- **Supabase Docs:** https://supabase.com/docs
- **Git Basics:** https://git-scm.com/doc

---

## Summary

You've successfully:
1. ✓ Exported project to GitHub
2. ✓ Connected GitHub to Netlify
3. ✓ Configured environment variables
4. ✓ Deployed the application
5. ✓ Set up Stripe webhooks
6. ✓ Verified payment flow works

Your pet portrait redemption portal is now live and ready to process customer orders!

For detailed deployment configuration, see `DEPLOYMENT.md`.
For quick reference during deployment, see `NETLIFY_DEPLOY_CHECKLIST.md`.
