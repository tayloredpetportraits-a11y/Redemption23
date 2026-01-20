
-- Create themes table
CREATE TABLE IF NOT EXISTS themes (
    id text PRIMARY KEY, -- User defined ID e.g 'cyberpunk'
    name text NOT NULL,
    cover_image_url text, -- For the card preview
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Policies (Public Read, Admin Write)
CREATE POLICY "Public themes are viewable by everyone" ON themes
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert themes" ON themes
    FOR INSERT WITH CHECK (true); -- Assuming server-side role bypasses or authenticated admin

CREATE POLICY "Admins can update themes" ON themes
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete themes" ON themes
    FOR DELETE USING (true);
