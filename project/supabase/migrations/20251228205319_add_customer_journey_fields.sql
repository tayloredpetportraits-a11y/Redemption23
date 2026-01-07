/*
  # Add Customer Journey Fields to Orders

  1. Changes to orders table
    - Add social_consent (boolean) - Whether customer allows social media feature
    - Add social_handle (text) - Customer's Instagram handle
    - Add rating (integer) - Customer rating 1-5 stars
    - Add review_text (text) - Optional review feedback
    - Add revision_status (text) - Status of revision request (none, requested, in_progress, completed)
    - Add revision_notes (text) - Customer's revision request notes

  2. Constraints
    - Rating must be between 1 and 5 if provided
    - Revision status must be one of allowed values

  3. Notes
    - All new fields are optional except social_consent and revision_status which have defaults
    - These fields support the complete customer journey from confirmation to review to revisions
*/

-- Add social consent and handle fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'social_consent'
  ) THEN
    ALTER TABLE orders ADD COLUMN social_consent boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'social_handle'
  ) THEN
    ALTER TABLE orders ADD COLUMN social_handle text;
  END IF;
END $$;

-- Add review fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'rating'
  ) THEN
    ALTER TABLE orders ADD COLUMN rating integer CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'review_text'
  ) THEN
    ALTER TABLE orders ADD COLUMN review_text text;
  END IF;
END $$;

-- Add revision fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'revision_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN revision_status text DEFAULT 'none' CHECK (revision_status IN ('none', 'requested', 'in_progress', 'completed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'revision_notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN revision_notes text;
  END IF;
END $$;