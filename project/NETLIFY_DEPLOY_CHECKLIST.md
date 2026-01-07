# Netlify Deployment Quick Checklist

Use this checklist when deploying to ensure nothing is missed.

## Pre-Deployment Checklist

### Configuration Files ✓
- [x] `netlify.toml` - Build command set to `npm run build`
- [x] `.node-version` - Node.js version specified (18.18.0)
- [x] `.eslintrc.json` - ESLint configured
- [x] `next.config.js` - Next.js configuration set
- [x] `package.json` - All dependencies listed

### Environment Variables Setup

In **Netlify Dashboard > Site Settings > Environment Variables**, add:

#### Supabase (3 variables)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

#### Admin
- [ ] `ADMIN_PASSWORD`

#### Stripe (3 variables)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET` (add after first deploy)

### Code Repository
- [ ] All changes committed
- [ ] Pushed to main/master branch
- [ ] Repository connected to Netlify

## Deployment Process

### Step 1: Initial Deploy
- [ ] Push code to repository
- [ ] Netlify auto-deploys
- [ ] Build completes successfully
- [ ] Site is live at `*.netlify.app`

### Step 2: Configure Stripe Webhook
- [ ] Copy deployed URL from Netlify
- [ ] Go to Stripe Dashboard > Developers > Webhooks
- [ ] Add endpoint: `https://your-site.netlify.app/api/webhooks/stripe`
- [ ] Select events: `checkout.session.completed`, `checkout.session.expired`
- [ ] Copy webhook signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Netlify env vars
- [ ] **Trigger redeploy** in Netlify

### Step 3: Verification Testing

#### Basic Tests
- [ ] Homepage loads without errors
- [ ] Admin login page accessible (`/admin/login`)
- [ ] Can log in with `ADMIN_PASSWORD`
- [ ] Admin dashboard shows orders

#### Payment Flow Tests
- [ ] Navigate to customer gallery
- [ ] Click "Unlock Bonus Portraits" button
- [ ] Redirects to Stripe Checkout
- [ ] Complete test payment (use test card: 4242 4242 4242 4242)
- [ ] Redirected back to gallery with success message
- [ ] Bonus images are unlocked
- [ ] Confetti animation plays

#### Backend Verification
- [ ] Check Netlify function logs - no errors
- [ ] Check Stripe webhook logs - event received
- [ ] Check Supabase database - `bonus_unlocked = true`

## Troubleshooting

### Build Failed
1. Check Netlify deploy logs
2. Look for TypeScript errors
3. Verify environment variables are set
4. Check Node.js version compatibility

### Webhook Not Working
1. Verify webhook URL matches deployed site
2. Check `STRIPE_WEBHOOK_SECRET` is set
3. Trigger redeploy after adding secret
4. Check Stripe Dashboard for webhook attempts

### Database Issues
1. Verify all 3 Supabase env vars are set
2. Check Supabase project is active
3. Review Supabase logs for connection errors

## Post-Deployment

### Production Readiness
- [ ] Change `ADMIN_PASSWORD` to strong password
- [ ] Switch to Stripe live keys
- [ ] Configure custom domain (optional)
- [ ] Enable Netlify Analytics
- [ ] Set up deploy notifications
- [ ] Test all flows with live data

### Monitoring Setup
- [ ] Netlify function logs monitored
- [ ] Stripe webhook delivery checked daily
- [ ] Supabase usage monitored
- [ ] Error tracking configured

## Quick Reference

**Netlify Dashboard:** https://app.netlify.com
**Stripe Dashboard:** https://dashboard.stripe.com
**Supabase Dashboard:** https://app.supabase.com

**Build Command:** `npm run build`
**Node Version:** 18.18.0
**Publish Dir:** `.next`

**Test Card:** 4242 4242 4242 4242 (any future date, any CVC)

## Common Commands

```bash
# Run build locally
npm run build

# Type check
npm run typecheck

# Run linter
npm run lint

# Test locally
npm run dev
```

## Support

Stuck? Check:
1. Netlify deploy logs
2. Netlify function logs
3. Stripe webhook logs
4. Supabase database logs
5. `DEPLOYMENT.md` for detailed troubleshooting
