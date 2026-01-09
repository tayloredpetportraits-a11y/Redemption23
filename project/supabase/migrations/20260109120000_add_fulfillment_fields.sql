/*
  # Add Fulfillment Fields and Update Status

  1. Changes to `orders` table
    - Add `fulfillment_status` (text) - Status of print fulfillment
    - Add `print_provider_order_id` (text) - ID from Printify
    - Update `status` check constraint to include all app statuses

  2. Security
    - Maintains existing RLS policies
*/

DO $$
BEGIN
  -- Add fulfillment_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'fulfillment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN fulfillment_status text;
  END IF;

  -- Add print_provider_order_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'print_provider_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN print_provider_order_id text;
  END IF;

  -- Update status check constraint
  -- First drop the existing constraint if we can identify it, or just drop the one we know exists from creation
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
  
  -- Add new constraint with all used statuses
  ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'ready', 'failed', 'fulfilled', 'revising', 'archived', 'processing_print'));

END $$;
