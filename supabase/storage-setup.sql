-- ============================================================
-- Threadology — Storage Setup
-- ============================================================
-- Run this in the Supabase SQL editor AFTER schema.sql.
--
-- Alternatively, create the bucket via the dashboard:
--   Storage → New bucket → name: "images", Public: ON
-- then run only the policy block below.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Create the bucket
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,                          -- publicly readable via URL
  5242880,                       -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;


-- ------------------------------------------------------------
-- 2. Storage RLS policies
-- ------------------------------------------------------------

-- Public read — anyone can fetch a URL from the images bucket
create policy "images: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'images');

-- Authenticated upload — users may only write into their own folder (user_id/)
create policy "images: owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated update — users may overwrite their own files
create policy "images: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated delete — users may remove their own files
create policy "images: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
