-- 1. Ensure the bucket is public and writable
INSERT INTO storage.buckets (id, name, public) 
VALUES ('themes', 'themes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop old policies to avoid conflicts, then re-add them
DROP POLICY IF EXISTS "Admin Upload Themes" ON storage.objects;
DROP POLICY IF EXISTS "Public View Themes" ON storage.objects;

CREATE POLICY "Admin Upload Themes" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'themes' );

CREATE POLICY "Public View Themes"
ON storage.objects FOR SELECT
USING ( bucket_id = 'themes' );

-- 3. Ensure the table can accept the data
ALTER TABLE themes 
ALTER COLUMN cover_image_url DROP NOT NULL; -- Make cover image optional just in case
