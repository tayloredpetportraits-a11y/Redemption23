/*
  # Add Social Media Consent Fields

  1. Changes to `orders` table
    - Add `marketing_consent` (boolean) - Permission for testimonials and marketing
    - Add `consent_date` (timestamp) - When consent was given for compliance

  Note: social_consent and social_handle already exist in the schema

  2. Security
    - These fields are customer-controlled and can be updated via the customer portal
*/

-- Add new consent fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'marketing_consent'
  ) THEN
    ALTER TABLE orders ADD COLUMN marketing_consent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'consent_date'
  ) THEN
    ALTER TABLE orders ADD COLUMN consent_date timestamptz;
  END IF;
END $$;

-- Create index for filtering social-approved orders in admin
CREATE INDEX IF NOT EXISTS idx_orders_social_consent ON orders(social_consent) WHERE social_consent = true;
