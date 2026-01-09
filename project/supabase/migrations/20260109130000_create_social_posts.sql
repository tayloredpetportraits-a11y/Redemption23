/*
  # Social Media Marketing Schema

  ## Overview
  Creates the table for tracking social media posts generated from order images.

  ## New Tables

  ### `social_posts` table
  Stores draft and published social media posts.
  - `id` (uuid, primary key)
  - `order_id` (uuid, foreign key) - Link to source order
  - `image_id` (uuid, foreign key) - Link to specific image used
  - `platform` (text) - e.g., 'instagram', 'facebook'
  - `caption` (text) - The post text content
  - `hashtags` (text[]) - Array of tags
  - `status` (text) - 'draft', 'scheduled', 'published', 'failed', 'rejected'
  - `scheduled_for` (timestamptz)
  - `published_at` (timestamptz)
  - `external_id` (text) - ID from the social platform
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Only authenticated users (admins) can view/manage these posts.
*/

CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  image_id uuid REFERENCES images(id) ON DELETE SET NULL,
  platform text NOT NULL DEFAULT 'instagram',
  caption text,
  hashtags text[],
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'rejected')),
  scheduled_for timestamptz,
  published_at timestamptz,
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only authenticated users (admins) should access marketing data.
-- Customers do not need to see this.

CREATE POLICY "Allow authenticated users to view social posts"
  ON social_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert social posts"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update social posts"
  ON social_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete social posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS social_posts_status_idx ON social_posts(status);
CREATE INDEX IF NOT EXISTS social_posts_order_id_idx ON social_posts(order_id);
