/*
  # Add Revision Metadata Column

  Adds a JSONB column to store structured revision request data:
  - selected_image_ids: Array of image IDs that need revision
  - reference_photo_urls: Array of URLs to reference photos uploaded by customer
  - requested_at: ISO timestamp of when revision was requested

  This enables better tracking of which specific portraits need changes
  and provides customers' reference materials for the revision.
*/

-- Add revision_metadata column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'revision_metadata'
  ) THEN
    ALTER TABLE orders ADD COLUMN revision_metadata JSONB;
  END IF;
END $$;

-- Add index for querying revision metadata
CREATE INDEX IF NOT EXISTS orders_revision_metadata_idx 
  ON orders USING GIN (revision_metadata);
