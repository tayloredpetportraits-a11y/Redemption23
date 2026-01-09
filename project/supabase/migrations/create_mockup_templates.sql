-- Create the mockup_templates table
create table if not exists public.mockup_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image_url text not null,
  keywords text[] default '{}',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.mockup_templates enable row level security;

-- Create policies (assuming public read access for generation, authenticated write for admin)
create policy "Allow public read access"
  on public.mockup_templates
  for select
  to public
  using (true);

create policy "Allow authenticated insert"
  on public.mockup_templates
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update"
  on public.mockup_templates
  for update
  to authenticated
  using (true);

create policy "Allow authenticated delete"
  on public.mockup_templates
  for delete
  to authenticated
  using (true);
