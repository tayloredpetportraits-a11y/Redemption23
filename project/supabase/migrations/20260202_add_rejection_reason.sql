-- Add rejection_reason column to images table for admin feedback
-- Migration: Support admin curation workflow with optional rejection notes

ALTER TABLE images 
ADD COLUMN IF NOT EXISTS rejection_reason text;

COMMENT ON COLUMN images.rejection_reason IS 'Optional reason provided by admin when rejecting an image. Used for regeneration feedback and quality improvement.';
