-- kudos-images storage bucket: public read, upload scoped to the caller's own uid folder.
-- Upload path convention (enforced by the policy below): kudos-images/{auth.uid()}/{uuid}.{ext}

insert into storage.buckets (id, name, public)
values ('kudos-images', 'kudos-images', true)
on conflict (id) do nothing;

create policy "kudos-images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'kudos-images');

create policy "authenticated users can upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'kudos-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
