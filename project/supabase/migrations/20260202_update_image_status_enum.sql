-- Update image status enum from 'pending_review' to 'generated'
-- Migration: Rename status values to match admin curation workflow

-- Update status column CHECK constraint to use 'generated' instead of 'pending_review'
ALTER TABLE images DROP CONSTRAINT IF EXISTS images_status_check;
ALTER TABLE images 
ADD CONSTRAINT images_status_check 
CHECK (status IN ('generated', 'approved', 'rejected'));

-- Rename existing 'pending_review' values to 'generated'
UPDATE images SET status = 'generated' WHERE status = 'pending_review';

-- Update default value to 'generated' for new uploads
ALTER TABLE images ALTER COLUMN status SET DEFAULT 'generated';

-- Create index for performance on status filtering (if not exists)
CREATE INDEX IF NOT EXISTS images_status_idx ON images(status);

-- Add helpful comment
COMMENT ON COLUMN images.status IS 'Image approval status: generated (AI created, awaiting admin review), approved (admin approved for customer viewing), rejected (admin rejected)';
