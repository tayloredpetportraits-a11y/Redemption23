
-- 1. Create printify_products table
create table if not exists public.printify_products (
  id text primary key,
  title text not null,
  blueprint_id integer,
  print_provider_id integer,
  variants jsonb default '[]'::jsonb,
  is_active boolean default true,
  last_synced_at timestamptz default now()
);

-- 2. Create blueprint_mappings table
create table if not exists public.blueprint_mappings (
  blueprint_id integer primary key,
  mockup_config_key text not null, -- e.g. "mug", "canvas", or "db:uuid"
  display_name text,
  updated_at timestamptz default now()
);

-- 3. Add configuration column to mockup_templates (for custom mapping)
alter table public.mockup_templates 
add column if not exists configuration jsonb default '{}'::jsonb;

-- 4. Enable RLS (Security)
alter table public.printify_products enable row level security;
alter table public.blueprint_mappings enable row level security;

-- 5. Policies (Allow Public Read, Service Write)
create policy "Allow public read products" on public.printify_products for select using (true);
create policy "Allow public read mappings" on public.blueprint_mappings for select using (true);

-- (If you are using Service Role, it bypasses RLS, so insert policies usually not needed for admin, 
-- but good to have if using authenticated client)
create policy "Allow admin all" on public.printify_products using (true) with check (true);
create policy "Allow admin all mappings" on public.blueprint_mappings using (true) with check (true);
