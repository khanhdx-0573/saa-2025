-- Department label shown under a Sunner's name in the "Người nhận" recipient
-- dropdown (MoMorph screen QIMJNgFb8K). No department source system exists
-- yet, so every profile defaults to "CEV1" until real department data lands.

alter table public.profiles
  add column department text not null default 'CEV1';
