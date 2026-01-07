/*
  # Make Product Type Optional

  1. Changes
    - Alter product_type column to allow NULL values
    - This enables support for digital products that may not have a physical product type

  2. Notes
    - Existing data with product_type values will not be affected
    - New orders can be created without specifying a product type
*/

-- Make product_type nullable
ALTER TABLE orders ALTER COLUMN product_type DROP NOT NULL;
