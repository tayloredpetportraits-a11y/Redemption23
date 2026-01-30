-- 1. DROP existing policies to avoid "Already Exists" errors
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Upload" on storage.objects;

-- 2. Create the Bucket (Safety check included)
insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do nothing;

-- 3. Re-Create the Policies Fresh
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'products' );

create policy "Admin Upload" 
on storage.objects for insert 
with check ( bucket_id = 'products' );
