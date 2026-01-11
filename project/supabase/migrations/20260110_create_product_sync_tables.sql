
-- 1. Table to store products synced from Printify
create table if not exists public.printify_products (
  id text primary key, -- Printify Product ID (e.g. "6943370fd8d79c83360b03c1")
  title text not null,
  blueprint_id integer not null,
  print_provider_id integer not null,
  variants jsonb default '[]'::jsonb, -- Store simplified variant list [{id, title}]
  is_active boolean default true,
  last_synced_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for printify_products
alter table public.printify_products enable row level security;

create policy "Allow public read printify_products"
  on public.printify_products for select
  to public
  using (true);

create policy "Allow authenticated all printify_products"
  on public.printify_products for all
  to authenticated
  using (true);

-- 2. Table to map Blueprint IDs to Mockup Configuration Keys
create table if not exists public.blueprint_mappings (
  blueprint_id integer primary key, -- The Blueprint ID (e.g. 68 for Mug)
  mockup_config_key text not null, -- matches MOCKUP_CONFIGS keys (e.g. 'tumbler', 'canvas-11x14')
  display_name text, -- Friendly name for admin (e.g. "Ceramic Mugs")
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for blueprint_mappings
alter table public.blueprint_mappings enable row level security;

create policy "Allow public read blueprint_mappings"
  on public.blueprint_mappings for select
  to public
  using (true);

create policy "Allow authenticated all blueprint_mappings"
  on public.blueprint_mappings for all
  to authenticated
  using (true);

-- Indexes for performance
create index if not exists idx_printify_products_blueprint on public.printify_products(blueprint_id);
