# GitHub Export & Vercel Deployment Guide

This guide will walk you through exporting your project to GitHub and deploying it to Vercel.

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
- ✓ `.env.example` (but NOT `.env`)
- ✓ `next.config.js`
- ✓ All other configuration files

**IMPORTANT:** Verify that `.env` is NOT uploaded (it should be ignored by .gitignore)

---

## Part 2: Deploy to Vercel

### Step 1: Connect Repository to Vercel

1. Go to [Vercel](https://vercel.com) and log in
2. Click **Add New** > **Project**
3. Import from **GitHub**
4. Select your repository

### Step 2: Configure Environment Variables (CRITICAL!)

Vercel will auto-detect Next.js. You MUST add your environment variables before deploying.

#### Supabase Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

#### Admin Password
```
ADMIN_PASSWORD
```
(Set this to a strong password!)

#### Stripe Variables
```
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```
(You can add `STRIPE_WEBHOOK_SECRET` after the first deploy if needed)

### Step 3: Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Your site will be live!

---

## Part 3: Configure Stripe Webhook

This step is required for bonus theme payments to work.

### Set Up Webhook in Stripe

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter endpoint URL: `https://your-site.vercel.app/api/webhooks/stripe`
   (Replace `your-site` with your actual Vercel domain)
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### Add Webhook Secret to Vercel

1. Go to Vercel Dashboard > Settings > Environment Variables
2. Add `STRIPE_WEBHOOK_SECRET` with the value from Stripe
3. **Redeploy** your project for changes to take effect.
