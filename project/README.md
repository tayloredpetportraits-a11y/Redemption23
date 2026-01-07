# Pet Portrait Redemption Portal

A modern web application for digital pet portrait businesses to deliver custom artwork to customers through an interactive gallery experience with premium upsell options.

## Features

### Customer Experience
- **Interactive Gallery** - Swipeable card interface to browse portrait variations
- **Portrait Preview** - Full-screen lightbox with download options
- **Bonus Theme Unlock** - Premium upsell for additional portrait styles
- **Secure Access** - Email and order ID verification
- **Review & Revision** - Customers can approve or request changes
- **Social Sharing** - Encourage social media posts for gallery access

### Admin Dashboard
- **Order Management** - Create and track customer orders
- **Image Upload** - Bulk upload portraits with drag-and-drop
- **Order Review** - View pending orders requiring admin action
- **Customer Journey** - Track order status from creation to completion

### Payment Integration
- **Stripe Checkout** - Secure payment processing for bonus themes
- **Webhook Automation** - Automatic unlock after successful payment
- **Test Mode** - Full support for Stripe test environment

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **Hosting:** Netlify
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Quick Start

### Prerequisites
- Node.js 18.x or higher
- Supabase account
- Stripe account (for payments)
- Netlify account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase and Stripe credentials in `.env`

4. **Run database migrations**
   - Go to your Supabase Dashboard
   - Execute the migrations in `supabase/migrations/` in order

5. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Deployment

See detailed deployment guides:
- **[GitHub Export Guide](GITHUB_EXPORT_GUIDE.md)** - Complete step-by-step instructions
- **[Deployment Guide](DEPLOYMENT.md)** - Netlify configuration and troubleshooting
- **[Quick Checklist](NETLIFY_DEPLOY_CHECKLIST.md)** - Fast reference for deployment

### Quick Deploy to Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify Dashboard
4. Deploy site
5. Configure Stripe webhook with deployed URL
6. Test payment flow

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin
ADMIN_PASSWORD=your_admin_password

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── customer/          # Customer-facing pages
│   │   ├── order/             # Order detail pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── CustomerGallery.tsx
│   │   ├── ImageLightbox.tsx
│   │   ├── SwipeCard.tsx
│   │   └── UpsellFunnel.tsx
│   ├── lib/                   # Utilities and helpers
│   │   ├── api/               # API client functions
│   │   └── supabase/          # Database clients
│   └── middleware.ts          # Auth middleware
├── supabase/
│   └── migrations/            # Database schema and migrations
├── public/                    # Static assets
├── netlify.toml              # Netlify configuration
└── next.config.js            # Next.js configuration
```

## Database Schema

### Tables

- **orders** - Customer orders and portraits
- **images** - Individual portrait images linked to orders

Key features:
- Row Level Security (RLS) enabled
- Automatic timestamps
- Secure file storage with Supabase Storage
- Audit trail with status tracking

## API Routes

### Public Endpoints
- `POST /api/customer/verify` - Verify customer email/order
- `POST /api/customer/[orderId]/confirm` - Confirm order completion
- `POST /api/customer/[orderId]/consent` - Grant gallery display consent
- `POST /api/customer/[orderId]/unlock` - Unlock order for viewing
- `POST /api/checkout/bonus-theme` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhook events

### Admin Endpoints (Protected)
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/logout` - Admin logout
- `POST /api/orders/create` - Create new order
- `POST /api/orders/[orderId]/review` - Submit order review
- `POST /api/orders/[orderId]/revision` - Request revision
- `POST /api/orders/[orderId]/social` - Confirm social sharing

## Customer Journey Flow

1. **Order Creation** - Admin creates order and uploads portraits
2. **Email Notification** - Customer receives gallery link
3. **Verification** - Customer verifies with email + order ID
4. **Gallery Access** - Browse and preview portraits
5. **Optional Upsell** - Purchase bonus theme via Stripe
6. **Review** - Approve portraits or request revisions
7. **Download** - Download approved portraits
8. **Social Sharing** - Optionally share on social media

## Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Check TypeScript types
```

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js recommended rules
- Tailwind CSS for styling
- Component-based architecture

## Security

- Environment variables never committed
- Row Level Security (RLS) on all database tables
- Admin routes protected with middleware
- Stripe webhook signature verification
- Secure file storage with signed URLs

## Testing

### Manual Testing Checklist

- [ ] Admin can create orders
- [ ] Customer can verify and access gallery
- [ ] Swipe cards work on mobile and desktop
- [ ] Lightbox displays images correctly
- [ ] Bonus theme purchase flow works
- [ ] Stripe webhook updates database
- [ ] Download buttons work
- [ ] Review submission works
- [ ] Revision requests are tracked

### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

## Troubleshooting

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting guides including:
- Build failures
- Stripe webhook issues
- Database connection problems
- Environment variable issues

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Private - All rights reserved

## Support

For deployment issues, see documentation:
- [GitHub Export Guide](GITHUB_EXPORT_GUIDE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Quick Checklist](NETLIFY_DEPLOY_CHECKLIST.md)

---

Built with Next.js, Supabase, and Stripe
