/*
  # Add Bonus Theme Purchase Fields

  1. Changes to `orders` table
    - Add `bonus_unlocked` (boolean) - Whether bonus theme images are unlocked
    - Add `bonus_payment_status` (text) - Payment status for bonus theme
    - Add `stripe_session_id` (text) - Stripe checkout session ID
    - Add `selected_image_id` (uuid) - Which primary image customer selected
    - Add `selected_print_product` (text) - Which print product customer chose
    - Add `customer_notes` (text) - Special customer requests
    - Add `pet_name` (text) - Name of the pet
    - Add `viewed_at` (timestamp) - When customer first viewed their gallery

  2. Changes to `images` table
    - Add `watermarked_url` (text) - URL to watermarked/preview version of image
    - Add `theme_name` (text) - Name of the image theme/style
    - Add `is_bonus` (boolean) - Whether this is a bonus theme image

  3. Security
    - All new fields are optional with sensible defaults
    - Maintains existing RLS policies
*/

-- Add new fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'bonus_unlocked'
  ) THEN
    ALTER TABLE orders ADD COLUMN bonus_unlocked boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'bonus_payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN bonus_payment_status text DEFAULT 'unpaid' CHECK (bonus_payment_status IN ('unpaid', 'paid', 'refunded'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_session_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'selected_image_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN selected_image_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'selected_print_product'
  ) THEN
    ALTER TABLE orders ADD COLUMN selected_print_product text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'pet_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN pet_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'viewed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN viewed_at timestamptz;
  END IF;
END $$;

-- Add new fields to images table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'watermarked_url'
  ) THEN
    ALTER TABLE images ADD COLUMN watermarked_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'theme_name'
  ) THEN
    ALTER TABLE images ADD COLUMN theme_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'is_bonus'
  ) THEN
    ALTER TABLE images ADD COLUMN is_bonus boolean DEFAULT false;
  END IF;
END $$;

-- Create index for stripe session lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Create index for selected images
CREATE INDEX IF NOT EXISTS idx_orders_selected_image ON orders(selected_image_id) WHERE selected_image_id IS NOT NULL;

-- Create index for bonus images
CREATE INDEX IF NOT EXISTS idx_images_is_bonus ON images(is_bonus) WHERE is_bonus = true;
