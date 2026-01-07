/*
  # Pet Portrait Redemption Database Schema

  ## Overview
  Creates the core database structure for the Pet Portrait Redemption Portal,
  including orders tracking and image management with proper security policies.

  ## New Tables

  ### `orders` table
  Stores customer order information and status tracking
  - `id` (uuid, primary key) - Unique order identifier
  - `customer_name` (text) - Customer's full name
  - `customer_email` (text) - Customer's email address
  - `product_type` (text) - Type of product ordered
  - `status` (text) - Order status: 'pending', 'ready', or 'failed'
  - `payment_status` (text) - Payment status: 'unpaid' or 'paid'
  - `created_at` (timestamptz) - Order creation timestamp

  ### `images` table
  Stores image files associated with orders
  - `id` (uuid, primary key) - Unique image identifier
  - `order_id` (uuid, foreign key) - References orders table
  - `url` (text) - Public URL to access the image
  - `storage_path` (text) - Path in Supabase Storage
  - `type` (text) - Image type: 'primary' or 'upsell'
  - `is_selected` (boolean) - Whether customer selected this image
  - `created_at` (timestamptz) - Image upload timestamp

  ## Security
  - RLS enabled on both tables
  - Public read access to support customer order pages
  - Authenticated users have full access (for admin operations)
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  product_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  created_at timestamptz DEFAULT now()
);

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text NOT NULL,
  type text NOT NULL CHECK (type IN ('primary', 'upsell')),
  is_selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders table
CREATE POLICY "Allow public read access to orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for images table
CREATE POLICY "Allow public read access to images"
  ON images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert images"
  ON images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update images"
  ON images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete images"
  ON images FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS images_order_id_idx ON images(order_id);
CREATE INDEX IF NOT EXISTS images_type_idx ON images(type);
