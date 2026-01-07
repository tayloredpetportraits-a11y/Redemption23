# Stripe Bonus Theme Integration Guide

This document explains how the Stripe payment integration works for the Bonus Theme product ($4.99, `prod_TkOEAVJxsWt0KG`).

## Overview

When customers view their gallery, they can unlock 5 additional bonus portraits in a different artistic style for $4.99. The payment is processed through Stripe Checkout, and upon successful payment, the bonus images are automatically unlocked.

## Setup Instructions

### 1. Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers > API Keys**
3. Copy the following keys:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)

### 2. Configure Environment Variables

Update your `.env` file with your Stripe keys:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 3. Set Up Stripe Webhook

The webhook automatically unlocks bonus images after successful payment.

#### Local Development (using Stripe CLI)

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward events to local server:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

#### Production Setup

1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add to your production environment variables

### 4. Verify Product ID

The integration uses Stripe product ID `prod_TkOEAVJxsWt0KG` at $4.99 (499 cents).

To verify or update the product:
1. Check your [Stripe Products](https://dashboard.stripe.com/products)
2. Ensure product `prod_TkOEAVJxsWt0KG` exists at $4.99
3. If you need to change the product ID, update it in:
   - `src/app/api/checkout/bonus-theme/route.ts` (line 16)

## How It Works

### Customer Flow

1. Customer lands on gallery page: `/customer/gallery/[orderId]`
2. Sees 5 base portraits (unlocked) + 5 bonus portraits (locked with preview)
3. Clicks "Unlock Bonus Portraits for $4.99"
4. Redirected to Stripe Checkout
5. Completes payment
6. Redirected back to gallery with `?payment=success`
7. Bonus images automatically unlock with confetti celebration

### Technical Flow

1. **Frontend** (`CustomerGallery.tsx`):
   - Calls `/api/checkout/bonus-theme` with `orderId`
   - Redirects to Stripe Checkout URL

2. **Checkout API** (`/api/checkout/bonus-theme/route.ts`):
   - Creates Stripe Checkout session
   - Sets success URL: `/customer/gallery/[orderId]?payment=success`
   - Sets cancel URL: `/customer/gallery/[orderId]?payment=cancelled`
   - Includes metadata: `{ orderId, productType: 'bonus_theme' }`

3. **Stripe Processes Payment**:
   - Customer completes checkout
   - Stripe sends webhook event

4. **Webhook Handler** (`/api/webhooks/stripe/route.ts`):
   - Verifies webhook signature
   - On `checkout.session.completed`:
     - Extracts `orderId` from metadata
     - Updates database:
       ```sql
       UPDATE orders SET
         bonus_unlocked = true,
         bonus_payment_status = 'paid',
         stripe_session_id = 'cs_...'
       WHERE id = orderId
       ```

5. **Customer Returns**:
   - Gallery page detects `?payment=success`
   - Shows confetti animation
   - Bonus images display unlocked

## Database Schema

The integration adds these fields to the `orders` table:

```sql
bonus_unlocked          BOOLEAN DEFAULT false
bonus_payment_status    TEXT CHECK (bonus_payment_status IN ('unpaid', 'paid', 'refunded'))
stripe_session_id       TEXT
```

And to the `images` table:

```sql
is_bonus                BOOLEAN DEFAULT false
watermarked_url         TEXT
theme_name              TEXT
```

## Testing

### Test Mode

1. Use Stripe test keys (starting with `pk_test_` and `sk_test_`)
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date (e.g., 12/34)
4. Any 3-digit CVC (e.g., 123)

### Test the Flow

1. Create a test order with bonus images
2. Navigate to gallery page
3. Click unlock button
4. Complete checkout with test card
5. Verify:
   - Webhook received (check Stripe Dashboard logs)
   - Database updated (`bonus_unlocked = true`)
   - Customer sees unlocked images

## API Routes

### POST `/api/checkout/bonus-theme`
Creates Stripe Checkout session for bonus theme purchase.

**Request Body:**
```json
{
  "orderId": "uuid"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### POST `/api/webhooks/stripe`
Handles Stripe webhook events. Automatically unlocks bonus images on successful payment.

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Events Handled:**
- `checkout.session.completed` - Unlocks bonus images
- `checkout.session.expired` - Logs expiration
- `payment_intent.succeeded` - Logs success
- `payment_intent.payment_failed` - Logs failure

## Security

- Webhook signatures are verified using `STRIPE_WEBHOOK_SECRET`
- Service role key used for database updates (bypasses RLS)
- Customer cannot manipulate unlock status without payment
- All Stripe communication uses HTTPS

## Troubleshooting

### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check webhook signing secret matches
- Review Stripe Dashboard > Developers > Webhooks > Event logs

### Database Not Updating
- Check Supabase logs
- Verify service role key is correct
- Ensure `orders` table has required fields

### Checkout Not Opening
- Verify publishable key is set in environment
- Check browser console for errors
- Ensure orderId is valid UUID

### Images Still Locked After Payment
- Check if webhook was received
- Verify `bonus_unlocked` field in database
- Check browser console for errors
- Try refreshing the page

## Price Changes

To change the price from $4.99:

1. Update Stripe product price in Dashboard
2. Update amount in checkout API:
   ```typescript
   // src/app/api/checkout/bonus-theme/route.ts
   unit_amount: 499, // Change this (in cents)
   ```
3. Update display price in component:
   ```typescript
   // src/components/CustomerGallery.tsx
   Unlock {bonusImages.length} Bonus Portraits for $4.99
   ```

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

For integration issues:
- Check webhook event logs in Stripe Dashboard
- Review Next.js server logs
- Check Supabase database logs
