# GitHub Export Checklist

Use this checklist before exporting to GitHub to ensure everything is ready.

## Pre-Export Verification

### Configuration Files ✓
- [x] `package.json` - All dependencies listed
- [x] `netlify.toml` - Build command: `npm run build`
- [x] `.node-version` - Node.js 18.18.0 specified
- [x] `next.config.js` - Properly configured
- [x] `tsconfig.json` - TypeScript configuration
- [x] `tailwind.config.js` - Tailwind setup
- [x] `postcss.config.js` - PostCSS configuration

### Environment Files ✓
- [x] `.env.example` - Template for environment variables
- [x] `.gitignore` - Properly ignores `.env` and build files
- [ ] `.env` - **VERIFY THIS IS IN .gitignore (MUST NOT BE COMMITTED!)**

### Documentation ✓
- [x] `README.md` - Project overview
- [x] `GITHUB_EXPORT_GUIDE.md` - Step-by-step export instructions
- [x] `DEPLOYMENT.md` - Detailed deployment guide
- [x] `NETLIFY_DEPLOY_CHECKLIST.md` - Quick reference
- [x] `STRIPE_SETUP.md` - Stripe configuration guide

### Source Code ✓
- [x] `src/app/` - All pages and API routes
- [x] `src/components/` - All React components
- [x] `src/lib/` - Utility functions and API client
- [x] `src/middleware.ts` - Auth middleware

### Database ✓
- [x] `supabase/migrations/` - All migration files
- [x] Migrations are numbered and ordered
- [x] RLS policies are included

### Build Verification ✓
- [x] `npm run build` succeeds locally
- [x] No TypeScript errors
- [x] No ESLint errors

## Sensitive Data Check (CRITICAL!)

Before pushing to GitHub, verify these files are NOT included:

### Files That MUST NOT Be Committed
- [ ] `.env` - Contains actual secrets
- [ ] `.env.local` - Contains local secrets
- [ ] `node_modules/` - Dependencies (too large)
- [ ] `.next/` - Build output (regenerated)
- [ ] `*.log` - Log files

### Verify .gitignore Works

Run this command to check what will be committed:
```bash
git status --ignored
```

Look for any files in the "Untracked files" section that contain secrets.

## Environment Variables to Set in Netlify

After pushing to GitHub, you'll need to set these in Netlify:

### Required (7 variables)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ADMIN_PASSWORD`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET` (add after first deploy)

### Values Reference

You can find the actual values in your local `.env` file:
```bash
cat .env
```

**Copy these values to a safe place BEFORE pushing to GitHub!**

Recommended: Use a password manager or secure note app to store these values.

## Quick Export Commands

Once you've verified everything above:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Check what will be committed
git status

# Verify .env is NOT in the list!
# If you see .env, STOP and check your .gitignore

# Create commit
git commit -m "Initial commit - Pet Portrait Redemption Portal"

# Add remote (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Post-Push Verification

After pushing to GitHub:

1. **Visit your GitHub repository**
2. **Check these files exist:**
   - ✓ `README.md` displays on homepage
   - ✓ `src/` directory with all code
   - ✓ `supabase/` directory with migrations
   - ✓ `.env.example` exists
   - ✓ All documentation files

3. **CRITICAL: Verify .env is NOT there!**
   - Go to repository root on GitHub
   - Look for `.env` file
   - If you see it, DELETE IT IMMEDIATELY:
     ```bash
     git rm .env
     git commit -m "Remove .env file"
     git push
     ```
   - Then rotate all your secrets (change passwords, regenerate API keys)

## Next Steps

After successful GitHub export:

1. Go to [Netlify](https://app.netlify.com)
2. Import your repository
3. Set environment variables
4. Deploy site
5. Configure Stripe webhook

See `GITHUB_EXPORT_GUIDE.md` for detailed instructions.

## Troubleshooting

### Git says "fatal: not a git repository"
```bash
git init
```

### Git says "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### I accidentally committed .env!
```bash
# Remove from git but keep local file
git rm --cached .env
git commit -m "Remove .env from git"
git push

# Then rotate ALL your secrets:
# - Change ADMIN_PASSWORD
# - Regenerate Supabase keys (if you want to be extra safe)
# - Regenerate Stripe keys (if you want to be extra safe)
```

### File is too large for GitHub
```bash
# Add to .gitignore
echo "large-file-name" >> .gitignore
git rm --cached large-file-name
git commit -m "Remove large file"
```

## Security Reminder

**NEVER commit these to GitHub:**
- API keys
- Database passwords
- Webhook secrets
- Admin passwords
- Private keys
- Access tokens
- `.env` files

**ALWAYS:**
- Use `.env.example` with placeholder values
- Store real values in Netlify environment variables
- Keep `.env` in `.gitignore`
- Use different passwords for development and production

---

Ready to export? Follow `GITHUB_EXPORT_GUIDE.md` for detailed step-by-step instructions.
