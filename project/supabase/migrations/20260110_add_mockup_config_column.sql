
-- Add configuration column to mockup_templates to store positioning data
alter table public.mockup_templates 
add column if not exists configuration jsonb default '{}'::jsonb;

-- Example configuration structure:
-- {
--   "top": "25%",
--   "left": "35%",
--   "width": "30%",
--   "aspectRatio": "11/14",
--   "rotation": 0
-- }
