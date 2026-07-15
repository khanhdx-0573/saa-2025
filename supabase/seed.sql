-- Local-dev-only sample data: 10 extra Sunner profiles (varied departments)
-- and ~28 kudos spread across them (varied senders/recipients/hashtags/
-- timestamps, a couple anonymous) so the Kudos Live Board — especially the
-- Spotlight word-cloud/ticker — has enough variety to demo instead of the
-- handful of near-identical e2e-fixture rows that accumulate from test runs.
-- Fixed UUIDs + `on conflict do nothing` make this safe to re-run (both on a
-- fresh `supabase db reset` and directly against an already-seeded db).
-- Never uses the e2e fixture user (e6f12d2e-...) as a kudos SENDER, so the
-- "All Kudos" viewer-scoped feed (and its e2e assertions) stay unaffected.
--
-- Below that: a SECOND, larger batch — 80 more Sunners (`c000...0001`..`0080`),
-- each sending exactly one kudos (`d000...0001`..`0080`) to the next Sunner in
-- the same batch (wrapping around) — added on request to make the Spotlight
-- word-cloud (which groups by SENDER, one node per distinct sender) crowded
-- enough to see it move/scroll (`computeBeltWidth` widens the belt once
-- sender count exceeds `MAX_STATIC_NODES` = 50). Kept as a fully
-- self-contained batch (its own senders/recipients) so it doesn't disturb
-- the original 10-profile/28-kudos block above.

insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
  ('a0000000-0000-0000-0000-000000000001', 'mai.nguyen@seed.local',   '{"full_name":"Nguyễn Thị Mai"}',  now(), now()),
  ('a0000000-0000-0000-0000-000000000002', 'long.tran@seed.local',    '{"full_name":"Trần Văn Long"}',   now(), now()),
  ('a0000000-0000-0000-0000-000000000003', 'anh.le@seed.local',       '{"full_name":"Lê Hoàng Anh"}',    now(), now()),
  ('a0000000-0000-0000-0000-000000000004', 'huong.pham@seed.local',   '{"full_name":"Phạm Thị Hương"}',  now(), now()),
  ('a0000000-0000-0000-0000-000000000005', 'duc.vu@seed.local',       '{"full_name":"Vũ Minh Đức"}',     now(), now()),
  ('a0000000-0000-0000-0000-000000000006', 'lan.hoang@seed.local',    '{"full_name":"Hoàng Thị Lan"}',   now(), now()),
  ('a0000000-0000-0000-0000-000000000007', 'nam.do@seed.local',       '{"full_name":"Đỗ Văn Nam"}',      now(), now()),
  ('a0000000-0000-0000-0000-000000000008', 'ngoc.bui@seed.local',     '{"full_name":"Bùi Thị Ngọc"}',    now(), now()),
  ('a0000000-0000-0000-0000-000000000009', 'tung.ngo@seed.local',     '{"full_name":"Ngô Văn Tùng"}',    now(), now()),
  ('a0000000-0000-0000-0000-000000000010', 'thu.dang@seed.local',     '{"full_name":"Đặng Thị Thu"}',    now(), now())
on conflict (id) do nothing;

-- E2E fixture profiles referenced by kudos rows below (b0000...0011–0013,
-- b0000...0024, b0000...0027). On a fresh `supabase start` the e2e global-setup
-- hasn't run yet, so these must exist in seed or the FK will reject.
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
  ('1004d5e5-2f89-4618-a674-736330091d6d', 'e2e-recipient@seed.local', '{"full_name":"E2E Recipient"}', now(), now()),
  ('03a6ff6f-bcb8-4482-af64-d1cb9769e93c', 'e2e-recipient2@seed.local', '{"full_name":"E2E Recipient 2"}', now(), now())
on conflict (id) do nothing;

update public.profiles set department = 'CEV2' where id = '1004d5e5-2f89-4618-a674-736330091d6d';
update public.profiles set department = 'CEV3' where id = '03a6ff6f-bcb8-4482-af64-d1cb9769e93c';

-- The auth.users trigger (handle_auth_user_sync) creates the matching
-- public.profiles row but has no department source — set it explicitly.
update public.profiles set department = 'CEV2'   where id = 'a0000000-0000-0000-0000-000000000001';
update public.profiles set department = 'CEV3'   where id = 'a0000000-0000-0000-0000-000000000002';
update public.profiles set department = 'CEV1'   where id = 'a0000000-0000-0000-0000-000000000003';
update public.profiles set department = 'CEVC10' where id = 'a0000000-0000-0000-0000-000000000004';
update public.profiles set department = 'CEV2'   where id = 'a0000000-0000-0000-0000-000000000005';
update public.profiles set department = 'CEV3'   where id = 'a0000000-0000-0000-0000-000000000006';
update public.profiles set department = 'CEV1'   where id = 'a0000000-0000-0000-0000-000000000007';
update public.profiles set department = 'CEVC10' where id = 'a0000000-0000-0000-0000-000000000008';
update public.profiles set department = 'CEV2'   where id = 'a0000000-0000-0000-0000-000000000009';
update public.profiles set department = 'CEV3'   where id = 'a0000000-0000-0000-0000-000000000010';

-- `created_at` is expressed as an offset from `now()` (not a literal
-- timestamp) — fix-bug: a literal "today" date/time can land in the FUTURE
-- relative to whatever `now()` actually is when this runs (this environment's
-- clock doesn't match wall time), which broke the realtime e2e check: a
-- genuinely-live insert (real `now()`) sorted OLDER than a seed row whose
-- hardcoded clock time hadn't "happened" yet. Relative offsets guarantee
-- every seed row stays safely in the past, however far `now()` has moved.
insert into public.kudos (id, sender_id, recipient_id, title, content, is_anonymous, anonymous_display_name, created_at)
values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Đồng đội tuyệt vời', '<p>Luôn hỗ trợ team hết mình trong mọi dự án.</p>', false, null, now() - interval '4758 minutes'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'Luôn hết mình vì team', '<p>Không ngại nhận thêm việc để giúp team kịp deadline.</p>', false, null, now() - interval '4705 minutes'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'Tốc độ xử lý đáng nể', '<p>Xử lý bug production cực nhanh, rất đáng khen.</p>', false, null, now() - interval '4440 minutes'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'Năng lượng tích cực', '<p>Luôn mang lại năng lượng tích cực cho cả team.</p>', false, null, now() - interval '4305 minutes'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', 'Chuyên nghiệp trong từng chi tiết', '<p>Report và tài liệu luôn chỉn chu, dễ hiểu.</p>', false, null, now() - interval '4210 minutes'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000007', 'Dám thử cái mới', '<p>Chủ động đề xuất giải pháp mới cho bài toán khó.</p>', false, null, now() - interval '3375 minutes'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000008', 'Tinh thần WASSHOI!', '<p>Luôn giữ tinh thần lăn xả trong mọi buổi demo.</p>', false, null, now() - interval '3290 minutes'),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000009', 'Tư duy đột phá', '<p>Ý tưởng refactor giúp team tiết kiệm rất nhiều thời gian.</p>', false, null, now() - interval '3210 minutes'),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000010', 'Luôn sẵn sàng hỗ trợ', '<p>Bất kể giờ giấc, luôn sẵn sàng support đồng đội.</p>', false, null, now() - interval '3065 minutes'),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Hiệu suất cao mỗi ngày', '<p>Hoàn thành task đúng hạn và chất lượng ổn định.</p>', false, null, now() - interval '2920 minutes'),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', '1004d5e5-2f89-4618-a674-736330091d6d', 'Cảm ơn vì đã giúp đỡ', '<p>Cảm ơn vì đã hướng dẫn tận tình cho thành viên mới.</p>', false, null, now() - interval '2720 minutes'),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', '1004d5e5-2f89-4618-a674-736330091d6d', 'Luôn lạc quan trong công việc', '<p>Giữ tinh thần lạc quan ngay cả khi dự án gặp khó khăn.</p>', false, null, now() - interval '1945 minutes'),
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000003', '03a6ff6f-bcb8-4482-af64-d1cb9769e93c', 'Xử lý task cực nhanh', '<p>Chốt xong module chỉ trong một buổi sáng.</p>', false, null, now() - interval '1860 minutes'),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Làm việc rất chỉn chu', '<p>Từng chi tiết nhỏ trong UI đều được kiểm tra kỹ.</p>', false, null, now() - interval '1785 minutes'),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'Không ngại thử thách', '<p>Nhận task khó nhất trong sprint mà không phàn nàn.</p>', false, null, now() - interval '1710 minutes'),
  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'WASSHOI tinh thần lan tỏa', '<p>Truyền cảm hứng cho cả team trong buổi retro.</p>', false, null, now() - interval '1570 minutes'),
  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000005', 'Ý tưởng sáng tạo', '<p>Đề xuất cách tối ưu performance rất thông minh.</p>', false, null, now() - interval '1435 minutes'),
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000006', 'Đồng hành cùng team', '<p>Luôn ở lại hỗ trợ đến khi mọi người xong việc.</p>', false, null, now() - interval '1300 minutes'),
  ('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000007', 'Hiệu suất vượt trội', '<p>Vượt KPI sprint này một cách ấn tượng.</p>', false, null, now() - interval '1225 minutes'),
  ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000008', 'Năng lượng tích cực mỗi ngày', '<p>Luôn tươi cười dù công việc bận rộn.</p>', false, null, now() - interval '555 minutes'),
  ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000009', 'Chuyên nghiệp và tận tâm', '<p>Chăm sóc khách hàng chu đáo trong từng buổi demo.</p>', false, null, now() - interval '480 minutes'),
  ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000010', 'Tốc độ đáng kinh ngạc', '<p>Fix xong 5 bug chỉ trong một buổi chiều.</p>', false, null, now() - interval '405 minutes'),
  ('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Dám nghĩ dám làm', '<p>Chủ động thử nghiệm công nghệ mới cho dự án.</p>', false, null, now() - interval '380 minutes'),
  ('b0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000004', '1004d5e5-2f89-4618-a674-736330091d6d', 'WASSHOI! Cảm ơn bạn', '<p>Cảm ơn vì đã luôn nhiệt tình hỗ trợ mọi người.</p>', false, null, now() - interval '305 minutes'),
  ('b0000000-0000-0000-0000-000000000025', null, 'a0000000-0000-0000-0000-000000000005', 'Một người bạn thầm lặng', '<p>Luôn âm thầm giúp đỡ mà không cần ai biết.</p>', true, 'Một Sunner bí ẩn', now() - interval '230 minutes'),
  ('b0000000-0000-0000-0000-000000000026', null, 'a0000000-0000-0000-0000-000000000002', 'Ý tưởng không giới hạn', '<p>Cách tiếp cận vấn đề rất khác biệt và hiệu quả.</p>', true, 'Người hâm mộ ẩn danh', now() - interval '155 minutes'),
  ('b0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000006', '03a6ff6f-bcb8-4482-af64-d1cb9769e93c', 'Luôn dẫn đầu hiệu suất', '<p>Là tấm gương về hiệu suất làm việc cho cả phòng.</p>', false, null, now() - interval '80 minutes'),
  ('b0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Người mang năng lượng tích cực', '<p>Mỗi buổi họp đều trở nên vui vẻ hơn nhờ bạn.</p>', false, null, now() - interval '5 minutes')
on conflict (id) do nothing;

insert into public.kudos_hashtags (kudos_id, hashtag_id)
values
  ('b0000000-0000-0000-0000-000000000001', 4),
  ('b0000000-0000-0000-0000-000000000002', 1),
  ('b0000000-0000-0000-0000-000000000003', 7),
  ('b0000000-0000-0000-0000-000000000004', 3),
  ('b0000000-0000-0000-0000-000000000005', 2),
  ('b0000000-0000-0000-0000-000000000006', 6),
  ('b0000000-0000-0000-0000-000000000007', 8),
  ('b0000000-0000-0000-0000-000000000008', 5),
  ('b0000000-0000-0000-0000-000000000009', 4),
  ('b0000000-0000-0000-0000-000000000010', 1),
  ('b0000000-0000-0000-0000-000000000011', 4),
  ('b0000000-0000-0000-0000-000000000012', 3),
  ('b0000000-0000-0000-0000-000000000013', 7),
  ('b0000000-0000-0000-0000-000000000014', 2),
  ('b0000000-0000-0000-0000-000000000015', 6),
  ('b0000000-0000-0000-0000-000000000016', 8),
  ('b0000000-0000-0000-0000-000000000017', 5),
  ('b0000000-0000-0000-0000-000000000018', 4),
  ('b0000000-0000-0000-0000-000000000019', 1),
  ('b0000000-0000-0000-0000-000000000020', 3),
  ('b0000000-0000-0000-0000-000000000021', 2),
  ('b0000000-0000-0000-0000-000000000022', 7),
  ('b0000000-0000-0000-0000-000000000023', 6),
  ('b0000000-0000-0000-0000-000000000024', 8),
  ('b0000000-0000-0000-0000-000000000025', 4),
  ('b0000000-0000-0000-0000-000000000026', 5),
  ('b0000000-0000-0000-0000-000000000027', 1),
  ('b0000000-0000-0000-0000-000000000028', 3)
on conflict (kudos_id, hashtag_id) do nothing;

insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
  ('c0000000-0000-0000-0000-000000000001', 'sunner001@seed.local', '{"full_name":"Nguyễn Văn Anh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000002', 'sunner002@seed.local', '{"full_name":"Trần Văn Bình"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000003', 'sunner003@seed.local', '{"full_name":"Lê Văn Cường"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000004', 'sunner004@seed.local', '{"full_name":"Phạm Văn Dũng"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000005', 'sunner005@seed.local', '{"full_name":"Hoàng Văn Giang"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000006', 'sunner006@seed.local', '{"full_name":"Huỳnh Văn Hà"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000007', 'sunner007@seed.local', '{"full_name":"Phan Văn Hải"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000008', 'sunner008@seed.local', '{"full_name":"Vũ Văn Hùng"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000009', 'sunner009@seed.local', '{"full_name":"Võ Văn Huy"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000010', 'sunner010@seed.local', '{"full_name":"Đặng Văn Khánh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000011', 'sunner011@seed.local', '{"full_name":"Bùi Văn Lan"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000012', 'sunner012@seed.local', '{"full_name":"Đỗ Văn Linh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000013', 'sunner013@seed.local', '{"full_name":"Hồ Văn Long"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000014', 'sunner014@seed.local', '{"full_name":"Ngô Văn Mai"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000015', 'sunner015@seed.local', '{"full_name":"Dương Văn Nam"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000016', 'sunner016@seed.local', '{"full_name":"Lý Văn Nga"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000017', 'sunner017@seed.local', '{"full_name":"Nguyễn Thị Nhung"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000018', 'sunner018@seed.local', '{"full_name":"Trần Thị Phong"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000019', 'sunner019@seed.local', '{"full_name":"Lê Thị Phương"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000020', 'sunner020@seed.local', '{"full_name":"Phạm Thị Quân"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000021', 'sunner021@seed.local', '{"full_name":"Hoàng Thị Sơn"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000022', 'sunner022@seed.local', '{"full_name":"Huỳnh Thị Tâm"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000023', 'sunner023@seed.local', '{"full_name":"Phan Thị Thảo"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000024', 'sunner024@seed.local', '{"full_name":"Vũ Thị Thắng"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000025', 'sunner025@seed.local', '{"full_name":"Võ Thị Thịnh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000026', 'sunner026@seed.local', '{"full_name":"Bùi Thị Thủy"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000027', 'sunner027@seed.local', '{"full_name":"Đỗ Thị Tiến"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000028', 'sunner028@seed.local', '{"full_name":"Hồ Thị Trang"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000029', 'sunner029@seed.local', '{"full_name":"Ngô Thị Trung"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000030', 'sunner030@seed.local', '{"full_name":"Dương Thị Tuấn"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000031', 'sunner031@seed.local', '{"full_name":"Lý Thị Tú"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000032', 'sunner032@seed.local', '{"full_name":"Nguyễn Hữu Vân"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000033', 'sunner033@seed.local', '{"full_name":"Trần Hữu Việt"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000034', 'sunner034@seed.local', '{"full_name":"Lê Hữu Vy"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000035', 'sunner035@seed.local', '{"full_name":"Phạm Hữu Yến"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000036', 'sunner036@seed.local', '{"full_name":"Hoàng Hữu Hương"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000037', 'sunner037@seed.local', '{"full_name":"Huỳnh Hữu Đạt"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000038', 'sunner038@seed.local', '{"full_name":"Phan Hữu Kiên"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000039', 'sunner039@seed.local', '{"full_name":"Vũ Hữu Hạnh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000040', 'sunner040@seed.local', '{"full_name":"Võ Hữu Anh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000041', 'sunner041@seed.local', '{"full_name":"Đặng Hữu Bình"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000042', 'sunner042@seed.local', '{"full_name":"Bùi Hữu Cường"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000043', 'sunner043@seed.local', '{"full_name":"Đỗ Hữu Dũng"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000044', 'sunner044@seed.local', '{"full_name":"Hồ Hữu Giang"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000045', 'sunner045@seed.local', '{"full_name":"Ngô Hữu Hà"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000046', 'sunner046@seed.local', '{"full_name":"Dương Hữu Hải"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000047', 'sunner047@seed.local', '{"full_name":"Lý Hữu Hùng"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000048', 'sunner048@seed.local', '{"full_name":"Nguyễn Đức Huy"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000049', 'sunner049@seed.local', '{"full_name":"Trần Đức Khánh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000050', 'sunner050@seed.local', '{"full_name":"Lê Đức Lan"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000051', 'sunner051@seed.local', '{"full_name":"Phạm Đức Linh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000052', 'sunner052@seed.local', '{"full_name":"Hoàng Đức Long"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000053', 'sunner053@seed.local', '{"full_name":"Huỳnh Đức Mai"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000054', 'sunner054@seed.local', '{"full_name":"Phan Đức Nam"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000055', 'sunner055@seed.local', '{"full_name":"Vũ Đức Nga"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000056', 'sunner056@seed.local', '{"full_name":"Võ Đức Nhung"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000057', 'sunner057@seed.local', '{"full_name":"Đặng Đức Phong"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000058', 'sunner058@seed.local', '{"full_name":"Bùi Đức Phương"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000059', 'sunner059@seed.local', '{"full_name":"Đỗ Đức Quân"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000060', 'sunner060@seed.local', '{"full_name":"Hồ Đức Sơn"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000061', 'sunner061@seed.local', '{"full_name":"Ngô Đức Tâm"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000062', 'sunner062@seed.local', '{"full_name":"Dương Đức Thảo"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000063', 'sunner063@seed.local', '{"full_name":"Lý Đức Thắng"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000064', 'sunner064@seed.local', '{"full_name":"Nguyễn Minh Thịnh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000065', 'sunner065@seed.local', '{"full_name":"Trần Minh Thu"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000066', 'sunner066@seed.local', '{"full_name":"Lê Minh Thủy"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000067', 'sunner067@seed.local', '{"full_name":"Phạm Minh Tiến"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000068', 'sunner068@seed.local', '{"full_name":"Hoàng Minh Trang"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000069', 'sunner069@seed.local', '{"full_name":"Huỳnh Minh Trung"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000070', 'sunner070@seed.local', '{"full_name":"Phan Minh Tuấn"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000071', 'sunner071@seed.local', '{"full_name":"Vũ Minh Tú"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000072', 'sunner072@seed.local', '{"full_name":"Võ Minh Vân"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000073', 'sunner073@seed.local', '{"full_name":"Đặng Minh Việt"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000074', 'sunner074@seed.local', '{"full_name":"Bùi Minh Vy"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000075', 'sunner075@seed.local', '{"full_name":"Đỗ Minh Yến"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000076', 'sunner076@seed.local', '{"full_name":"Hồ Minh Hương"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000077', 'sunner077@seed.local', '{"full_name":"Ngô Minh Đạt"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000078', 'sunner078@seed.local', '{"full_name":"Dương Minh Kiên"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000079', 'sunner079@seed.local', '{"full_name":"Lý Minh Hạnh"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000080', 'sunner080@seed.local', '{"full_name":"Nguyễn Ngọc Anh"}', now(), now())
on conflict (id) do nothing;

update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000001';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000002';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000003';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000004';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000005';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000006';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000007';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000008';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000009';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000010';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000011';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000012';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000013';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000014';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000015';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000016';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000017';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000018';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000019';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000020';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000021';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000022';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000023';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000024';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000025';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000026';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000027';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000028';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000029';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000030';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000031';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000032';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000033';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000034';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000035';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000036';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000037';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000038';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000039';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000040';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000041';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000042';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000043';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000044';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000045';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000046';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000047';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000048';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000049';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000050';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000051';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000052';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000053';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000054';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000055';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000056';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000057';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000058';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000059';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000060';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000061';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000062';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000063';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000064';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000065';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000066';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000067';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000068';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000069';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000070';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000071';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000072';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000073';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000074';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000075';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000076';
update public.profiles set department = 'CEV1' where id = 'c0000000-0000-0000-0000-000000000077';
update public.profiles set department = 'CEV2' where id = 'c0000000-0000-0000-0000-000000000078';
update public.profiles set department = 'CEV3' where id = 'c0000000-0000-0000-0000-000000000079';
update public.profiles set department = 'CEVC10' where id = 'c0000000-0000-0000-0000-000000000080';

insert into public.kudos (id, sender_id, recipient_id, title, content, is_anonymous, anonymous_display_name, created_at)
values
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Đồng đội tuyệt vời', '<p>Luôn hỗ trợ team hết mình trong mọi dự án.</p>', false, null, now() - interval '60 minutes'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Luôn hết mình vì team', '<p>Không ngại nhận thêm việc để giúp team kịp deadline.</p>', false, null, now() - interval '107 minutes'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'Tốc độ xử lý đáng nể', '<p>Xử lý bug production cực nhanh, rất đáng khen.</p>', false, null, now() - interval '154 minutes'),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'Năng lượng tích cực', '<p>Luôn mang lại năng lượng tích cực cho cả team.</p>', false, null, now() - interval '201 minutes'),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', 'Chuyên nghiệp trong từng chi tiết', '<p>Report và tài liệu luôn chỉn chu, dễ hiểu.</p>', false, null, now() - interval '248 minutes'),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', 'Dám thử cái mới', '<p>Chủ động đề xuất giải pháp mới cho bài toán khó.</p>', false, null, now() - interval '295 minutes'),
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000008', 'Tinh thần WASSHOI!', '<p>Luôn giữ tinh thần lăn xả trong mọi buổi demo.</p>', false, null, now() - interval '342 minutes'),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000009', 'Tư duy đột phá', '<p>Ý tưởng refactor giúp team tiết kiệm rất nhiều thời gian.</p>', false, null, now() - interval '389 minutes'),
  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000010', 'Luôn sẵn sàng hỗ trợ', '<p>Bất kể giờ giấc, luôn sẵn sàng support đồng đội.</p>', false, null, now() - interval '436 minutes'),
  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000011', 'Hiệu suất cao mỗi ngày', '<p>Hoàn thành task đúng hạn và chất lượng ổn định.</p>', false, null, now() - interval '483 minutes'),
  ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000012', 'Cảm ơn vì đã giúp đỡ', '<p>Cảm ơn vì đã hướng dẫn tận tình cho thành viên mới.</p>', false, null, now() - interval '530 minutes'),
  ('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000013', 'Luôn lạc quan trong công việc', '<p>Giữ tinh thần lạc quan ngay cả khi dự án gặp khó khăn.</p>', false, null, now() - interval '577 minutes'),
  ('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000014', 'Xử lý task cực nhanh', '<p>Chốt xong module chỉ trong một buổi sáng.</p>', false, null, now() - interval '624 minutes'),
  ('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000015', 'Làm việc rất chỉn chu', '<p>Từng chi tiết nhỏ trong UI đều được kiểm tra kỹ.</p>', false, null, now() - interval '671 minutes'),
  ('d0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000016', 'Không ngại thử thách', '<p>Nhận task khó nhất trong sprint mà không phàn nàn.</p>', false, null, now() - interval '718 minutes'),
  ('d0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000017', 'WASSHOI tinh thần lan tỏa', '<p>Truyền cảm hứng cho cả team trong buổi retro.</p>', false, null, now() - interval '765 minutes'),
  ('d0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000018', 'Ý tưởng sáng tạo', '<p>Đề xuất cách tối ưu performance rất thông minh.</p>', false, null, now() - interval '812 minutes'),
  ('d0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000019', 'Đồng hành cùng team', '<p>Luôn ở lại hỗ trợ đến khi mọi người xong việc.</p>', false, null, now() - interval '859 minutes'),
  ('d0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000020', 'Hiệu suất vượt trội', '<p>Vượt KPI sprint này một cách ấn tượng.</p>', false, null, now() - interval '906 minutes'),
  ('d0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000021', 'Dám nghĩ dám làm', '<p>Chủ động thử nghiệm công nghệ mới cho dự án.</p>', false, null, now() - interval '953 minutes'),
  ('d0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000022', 'Đồng đội tuyệt vời', '<p>Luôn hỗ trợ team hết mình trong mọi dự án.</p>', false, null, now() - interval '1000 minutes'),
  ('d0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000023', 'Luôn hết mình vì team', '<p>Không ngại nhận thêm việc để giúp team kịp deadline.</p>', false, null, now() - interval '1047 minutes'),
  ('d0000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000024', 'Tốc độ xử lý đáng nể', '<p>Xử lý bug production cực nhanh, rất đáng khen.</p>', false, null, now() - interval '1094 minutes'),
  ('d0000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000025', 'Năng lượng tích cực', '<p>Luôn mang lại năng lượng tích cực cho cả team.</p>', false, null, now() - interval '1141 minutes'),
  ('d0000000-0000-0000-0000-000000000025', 'c0000000-0000-0000-0000-000000000025', 'c0000000-0000-0000-0000-000000000026', 'Chuyên nghiệp trong từng chi tiết', '<p>Report và tài liệu luôn chỉn chu, dễ hiểu.</p>', false, null, now() - interval '1188 minutes'),
  ('d0000000-0000-0000-0000-000000000026', 'c0000000-0000-0000-0000-000000000026', 'c0000000-0000-0000-0000-000000000027', 'Dám thử cái mới', '<p>Chủ động đề xuất giải pháp mới cho bài toán khó.</p>', false, null, now() - interval '1235 minutes'),
  ('d0000000-0000-0000-0000-000000000027', 'c0000000-0000-0000-0000-000000000027', 'c0000000-0000-0000-0000-000000000028', 'Tinh thần WASSHOI!', '<p>Luôn giữ tinh thần lăn xả trong mọi buổi demo.</p>', false, null, now() - interval '1282 minutes'),
  ('d0000000-0000-0000-0000-000000000028', 'c0000000-0000-0000-0000-000000000028', 'c0000000-0000-0000-0000-000000000029', 'Tư duy đột phá', '<p>Ý tưởng refactor giúp team tiết kiệm rất nhiều thời gian.</p>', false, null, now() - interval '1329 minutes'),
  ('d0000000-0000-0000-0000-000000000029', 'c0000000-0000-0000-0000-000000000029', 'c0000000-0000-0000-0000-000000000030', 'Luôn sẵn sàng hỗ trợ', '<p>Bất kể giờ giấc, luôn sẵn sàng support đồng đội.</p>', false, null, now() - interval '1376 minutes'),
  ('d0000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000031', 'Hiệu suất cao mỗi ngày', '<p>Hoàn thành task đúng hạn và chất lượng ổn định.</p>', false, null, now() - interval '1423 minutes'),
  ('d0000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000032', 'Cảm ơn vì đã giúp đỡ', '<p>Cảm ơn vì đã hướng dẫn tận tình cho thành viên mới.</p>', false, null, now() - interval '1470 minutes'),
  ('d0000000-0000-0000-0000-000000000032', 'c0000000-0000-0000-0000-000000000032', 'c0000000-0000-0000-0000-000000000033', 'Luôn lạc quan trong công việc', '<p>Giữ tinh thần lạc quan ngay cả khi dự án gặp khó khăn.</p>', false, null, now() - interval '1517 minutes'),
  ('d0000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000034', 'Xử lý task cực nhanh', '<p>Chốt xong module chỉ trong một buổi sáng.</p>', false, null, now() - interval '1564 minutes'),
  ('d0000000-0000-0000-0000-000000000034', 'c0000000-0000-0000-0000-000000000034', 'c0000000-0000-0000-0000-000000000035', 'Làm việc rất chỉn chu', '<p>Từng chi tiết nhỏ trong UI đều được kiểm tra kỹ.</p>', false, null, now() - interval '1611 minutes'),
  ('d0000000-0000-0000-0000-000000000035', 'c0000000-0000-0000-0000-000000000035', 'c0000000-0000-0000-0000-000000000036', 'Không ngại thử thách', '<p>Nhận task khó nhất trong sprint mà không phàn nàn.</p>', false, null, now() - interval '1658 minutes'),
  ('d0000000-0000-0000-0000-000000000036', 'c0000000-0000-0000-0000-000000000036', 'c0000000-0000-0000-0000-000000000037', 'WASSHOI tinh thần lan tỏa', '<p>Truyền cảm hứng cho cả team trong buổi retro.</p>', false, null, now() - interval '1705 minutes'),
  ('d0000000-0000-0000-0000-000000000037', 'c0000000-0000-0000-0000-000000000037', 'c0000000-0000-0000-0000-000000000038', 'Ý tưởng sáng tạo', '<p>Đề xuất cách tối ưu performance rất thông minh.</p>', false, null, now() - interval '1752 minutes'),
  ('d0000000-0000-0000-0000-000000000038', 'c0000000-0000-0000-0000-000000000038', 'c0000000-0000-0000-0000-000000000039', 'Đồng hành cùng team', '<p>Luôn ở lại hỗ trợ đến khi mọi người xong việc.</p>', false, null, now() - interval '1799 minutes'),
  ('d0000000-0000-0000-0000-000000000039', 'c0000000-0000-0000-0000-000000000039', 'c0000000-0000-0000-0000-000000000040', 'Hiệu suất vượt trội', '<p>Vượt KPI sprint này một cách ấn tượng.</p>', false, null, now() - interval '1846 minutes'),
  ('d0000000-0000-0000-0000-000000000040', 'c0000000-0000-0000-0000-000000000040', 'c0000000-0000-0000-0000-000000000041', 'Dám nghĩ dám làm', '<p>Chủ động thử nghiệm công nghệ mới cho dự án.</p>', false, null, now() - interval '1893 minutes'),
  ('d0000000-0000-0000-0000-000000000041', 'c0000000-0000-0000-0000-000000000041', 'c0000000-0000-0000-0000-000000000042', 'Đồng đội tuyệt vời', '<p>Luôn hỗ trợ team hết mình trong mọi dự án.</p>', false, null, now() - interval '1940 minutes'),
  ('d0000000-0000-0000-0000-000000000042', 'c0000000-0000-0000-0000-000000000042', 'c0000000-0000-0000-0000-000000000043', 'Luôn hết mình vì team', '<p>Không ngại nhận thêm việc để giúp team kịp deadline.</p>', false, null, now() - interval '1987 minutes'),
  ('d0000000-0000-0000-0000-000000000043', 'c0000000-0000-0000-0000-000000000043', 'c0000000-0000-0000-0000-000000000044', 'Tốc độ xử lý đáng nể', '<p>Xử lý bug production cực nhanh, rất đáng khen.</p>', false, null, now() - interval '2034 minutes'),
  ('d0000000-0000-0000-0000-000000000044', 'c0000000-0000-0000-0000-000000000044', 'c0000000-0000-0000-0000-000000000045', 'Năng lượng tích cực', '<p>Luôn mang lại năng lượng tích cực cho cả team.</p>', false, null, now() - interval '2081 minutes'),
  ('d0000000-0000-0000-0000-000000000045', 'c0000000-0000-0000-0000-000000000045', 'c0000000-0000-0000-0000-000000000046', 'Chuyên nghiệp trong từng chi tiết', '<p>Report và tài liệu luôn chỉn chu, dễ hiểu.</p>', false, null, now() - interval '2128 minutes'),
  ('d0000000-0000-0000-0000-000000000046', 'c0000000-0000-0000-0000-000000000046', 'c0000000-0000-0000-0000-000000000047', 'Dám thử cái mới', '<p>Chủ động đề xuất giải pháp mới cho bài toán khó.</p>', false, null, now() - interval '2175 minutes'),
  ('d0000000-0000-0000-0000-000000000047', 'c0000000-0000-0000-0000-000000000047', 'c0000000-0000-0000-0000-000000000048', 'Tinh thần WASSHOI!', '<p>Luôn giữ tinh thần lăn xả trong mọi buổi demo.</p>', false, null, now() - interval '2222 minutes'),
  ('d0000000-0000-0000-0000-000000000048', 'c0000000-0000-0000-0000-000000000048', 'c0000000-0000-0000-0000-000000000049', 'Tư duy đột phá', '<p>Ý tưởng refactor giúp team tiết kiệm rất nhiều thời gian.</p>', false, null, now() - interval '2269 minutes'),
  ('d0000000-0000-0000-0000-000000000049', 'c0000000-0000-0000-0000-000000000049', 'c0000000-0000-0000-0000-000000000050', 'Luôn sẵn sàng hỗ trợ', '<p>Bất kể giờ giấc, luôn sẵn sàng support đồng đội.</p>', false, null, now() - interval '2316 minutes'),
  ('d0000000-0000-0000-0000-000000000050', 'c0000000-0000-0000-0000-000000000050', 'c0000000-0000-0000-0000-000000000051', 'Hiệu suất cao mỗi ngày', '<p>Hoàn thành task đúng hạn và chất lượng ổn định.</p>', false, null, now() - interval '2363 minutes'),
  ('d0000000-0000-0000-0000-000000000051', 'c0000000-0000-0000-0000-000000000051', 'c0000000-0000-0000-0000-000000000052', 'Cảm ơn vì đã giúp đỡ', '<p>Cảm ơn vì đã hướng dẫn tận tình cho thành viên mới.</p>', false, null, now() - interval '2410 minutes'),
  ('d0000000-0000-0000-0000-000000000052', 'c0000000-0000-0000-0000-000000000052', 'c0000000-0000-0000-0000-000000000053', 'Luôn lạc quan trong công việc', '<p>Giữ tinh thần lạc quan ngay cả khi dự án gặp khó khăn.</p>', false, null, now() - interval '2457 minutes'),
  ('d0000000-0000-0000-0000-000000000053', 'c0000000-0000-0000-0000-000000000053', 'c0000000-0000-0000-0000-000000000054', 'Xử lý task cực nhanh', '<p>Chốt xong module chỉ trong một buổi sáng.</p>', false, null, now() - interval '2504 minutes'),
  ('d0000000-0000-0000-0000-000000000054', 'c0000000-0000-0000-0000-000000000054', 'c0000000-0000-0000-0000-000000000055', 'Làm việc rất chỉn chu', '<p>Từng chi tiết nhỏ trong UI đều được kiểm tra kỹ.</p>', false, null, now() - interval '2551 minutes'),
  ('d0000000-0000-0000-0000-000000000055', 'c0000000-0000-0000-0000-000000000055', 'c0000000-0000-0000-0000-000000000056', 'Không ngại thử thách', '<p>Nhận task khó nhất trong sprint mà không phàn nàn.</p>', false, null, now() - interval '2598 minutes'),
  ('d0000000-0000-0000-0000-000000000056', 'c0000000-0000-0000-0000-000000000056', 'c0000000-0000-0000-0000-000000000057', 'WASSHOI tinh thần lan tỏa', '<p>Truyền cảm hứng cho cả team trong buổi retro.</p>', false, null, now() - interval '2645 minutes'),
  ('d0000000-0000-0000-0000-000000000057', 'c0000000-0000-0000-0000-000000000057', 'c0000000-0000-0000-0000-000000000058', 'Ý tưởng sáng tạo', '<p>Đề xuất cách tối ưu performance rất thông minh.</p>', false, null, now() - interval '2692 minutes'),
  ('d0000000-0000-0000-0000-000000000058', 'c0000000-0000-0000-0000-000000000058', 'c0000000-0000-0000-0000-000000000059', 'Đồng hành cùng team', '<p>Luôn ở lại hỗ trợ đến khi mọi người xong việc.</p>', false, null, now() - interval '2739 minutes'),
  ('d0000000-0000-0000-0000-000000000059', 'c0000000-0000-0000-0000-000000000059', 'c0000000-0000-0000-0000-000000000060', 'Hiệu suất vượt trội', '<p>Vượt KPI sprint này một cách ấn tượng.</p>', false, null, now() - interval '2786 minutes'),
  ('d0000000-0000-0000-0000-000000000060', 'c0000000-0000-0000-0000-000000000060', 'c0000000-0000-0000-0000-000000000061', 'Dám nghĩ dám làm', '<p>Chủ động thử nghiệm công nghệ mới cho dự án.</p>', false, null, now() - interval '2833 minutes'),
  ('d0000000-0000-0000-0000-000000000061', 'c0000000-0000-0000-0000-000000000061', 'c0000000-0000-0000-0000-000000000062', 'Đồng đội tuyệt vời', '<p>Luôn hỗ trợ team hết mình trong mọi dự án.</p>', false, null, now() - interval '2880 minutes'),
  ('d0000000-0000-0000-0000-000000000062', 'c0000000-0000-0000-0000-000000000062', 'c0000000-0000-0000-0000-000000000063', 'Luôn hết mình vì team', '<p>Không ngại nhận thêm việc để giúp team kịp deadline.</p>', false, null, now() - interval '2927 minutes'),
  ('d0000000-0000-0000-0000-000000000063', 'c0000000-0000-0000-0000-000000000063', 'c0000000-0000-0000-0000-000000000064', 'Tốc độ xử lý đáng nể', '<p>Xử lý bug production cực nhanh, rất đáng khen.</p>', false, null, now() - interval '2974 minutes'),
  ('d0000000-0000-0000-0000-000000000064', 'c0000000-0000-0000-0000-000000000064', 'c0000000-0000-0000-0000-000000000065', 'Năng lượng tích cực', '<p>Luôn mang lại năng lượng tích cực cho cả team.</p>', false, null, now() - interval '3021 minutes'),
  ('d0000000-0000-0000-0000-000000000065', 'c0000000-0000-0000-0000-000000000065', 'c0000000-0000-0000-0000-000000000066', 'Chuyên nghiệp trong từng chi tiết', '<p>Report và tài liệu luôn chỉn chu, dễ hiểu.</p>', false, null, now() - interval '3068 minutes'),
  ('d0000000-0000-0000-0000-000000000066', 'c0000000-0000-0000-0000-000000000066', 'c0000000-0000-0000-0000-000000000067', 'Dám thử cái mới', '<p>Chủ động đề xuất giải pháp mới cho bài toán khó.</p>', false, null, now() - interval '3115 minutes'),
  ('d0000000-0000-0000-0000-000000000067', 'c0000000-0000-0000-0000-000000000067', 'c0000000-0000-0000-0000-000000000068', 'Tinh thần WASSHOI!', '<p>Luôn giữ tinh thần lăn xả trong mọi buổi demo.</p>', false, null, now() - interval '3162 minutes'),
  ('d0000000-0000-0000-0000-000000000068', 'c0000000-0000-0000-0000-000000000068', 'c0000000-0000-0000-0000-000000000069', 'Tư duy đột phá', '<p>Ý tưởng refactor giúp team tiết kiệm rất nhiều thời gian.</p>', false, null, now() - interval '3209 minutes'),
  ('d0000000-0000-0000-0000-000000000069', 'c0000000-0000-0000-0000-000000000069', 'c0000000-0000-0000-0000-000000000070', 'Luôn sẵn sàng hỗ trợ', '<p>Bất kể giờ giấc, luôn sẵn sàng support đồng đội.</p>', false, null, now() - interval '3256 minutes'),
  ('d0000000-0000-0000-0000-000000000070', 'c0000000-0000-0000-0000-000000000070', 'c0000000-0000-0000-0000-000000000071', 'Hiệu suất cao mỗi ngày', '<p>Hoàn thành task đúng hạn và chất lượng ổn định.</p>', false, null, now() - interval '3303 minutes'),
  ('d0000000-0000-0000-0000-000000000071', 'c0000000-0000-0000-0000-000000000071', 'c0000000-0000-0000-0000-000000000072', 'Cảm ơn vì đã giúp đỡ', '<p>Cảm ơn vì đã hướng dẫn tận tình cho thành viên mới.</p>', false, null, now() - interval '3350 minutes'),
  ('d0000000-0000-0000-0000-000000000072', 'c0000000-0000-0000-0000-000000000072', 'c0000000-0000-0000-0000-000000000073', 'Luôn lạc quan trong công việc', '<p>Giữ tinh thần lạc quan ngay cả khi dự án gặp khó khăn.</p>', false, null, now() - interval '3397 minutes'),
  ('d0000000-0000-0000-0000-000000000073', 'c0000000-0000-0000-0000-000000000073', 'c0000000-0000-0000-0000-000000000074', 'Xử lý task cực nhanh', '<p>Chốt xong module chỉ trong một buổi sáng.</p>', false, null, now() - interval '3444 minutes'),
  ('d0000000-0000-0000-0000-000000000074', 'c0000000-0000-0000-0000-000000000074', 'c0000000-0000-0000-0000-000000000075', 'Làm việc rất chỉn chu', '<p>Từng chi tiết nhỏ trong UI đều được kiểm tra kỹ.</p>', false, null, now() - interval '3491 minutes'),
  ('d0000000-0000-0000-0000-000000000075', 'c0000000-0000-0000-0000-000000000075', 'c0000000-0000-0000-0000-000000000076', 'Không ngại thử thách', '<p>Nhận task khó nhất trong sprint mà không phàn nàn.</p>', false, null, now() - interval '3538 minutes'),
  ('d0000000-0000-0000-0000-000000000076', 'c0000000-0000-0000-0000-000000000076', 'c0000000-0000-0000-0000-000000000077', 'WASSHOI tinh thần lan tỏa', '<p>Truyền cảm hứng cho cả team trong buổi retro.</p>', false, null, now() - interval '3585 minutes'),
  ('d0000000-0000-0000-0000-000000000077', 'c0000000-0000-0000-0000-000000000077', 'c0000000-0000-0000-0000-000000000078', 'Ý tưởng sáng tạo', '<p>Đề xuất cách tối ưu performance rất thông minh.</p>', false, null, now() - interval '3632 minutes'),
  ('d0000000-0000-0000-0000-000000000078', 'c0000000-0000-0000-0000-000000000078', 'c0000000-0000-0000-0000-000000000079', 'Đồng hành cùng team', '<p>Luôn ở lại hỗ trợ đến khi mọi người xong việc.</p>', false, null, now() - interval '3679 minutes'),
  ('d0000000-0000-0000-0000-000000000079', 'c0000000-0000-0000-0000-000000000079', 'c0000000-0000-0000-0000-000000000080', 'Hiệu suất vượt trội', '<p>Vượt KPI sprint này một cách ấn tượng.</p>', false, null, now() - interval '3726 minutes'),
  ('d0000000-0000-0000-0000-000000000080', 'c0000000-0000-0000-0000-000000000080', 'c0000000-0000-0000-0000-000000000001', 'Dám nghĩ dám làm', '<p>Chủ động thử nghiệm công nghệ mới cho dự án.</p>', false, null, now() - interval '3773 minutes')
on conflict (id) do nothing;

insert into public.kudos_hashtags (kudos_id, hashtag_id)
values
  ('d0000000-0000-0000-0000-000000000001', 1),
  ('d0000000-0000-0000-0000-000000000002', 2),
  ('d0000000-0000-0000-0000-000000000003', 3),
  ('d0000000-0000-0000-0000-000000000004', 4),
  ('d0000000-0000-0000-0000-000000000005', 5),
  ('d0000000-0000-0000-0000-000000000006', 6),
  ('d0000000-0000-0000-0000-000000000007', 7),
  ('d0000000-0000-0000-0000-000000000008', 8),
  ('d0000000-0000-0000-0000-000000000009', 1),
  ('d0000000-0000-0000-0000-000000000010', 2),
  ('d0000000-0000-0000-0000-000000000011', 3),
  ('d0000000-0000-0000-0000-000000000012', 4),
  ('d0000000-0000-0000-0000-000000000013', 5),
  ('d0000000-0000-0000-0000-000000000014', 6),
  ('d0000000-0000-0000-0000-000000000015', 7),
  ('d0000000-0000-0000-0000-000000000016', 8),
  ('d0000000-0000-0000-0000-000000000017', 1),
  ('d0000000-0000-0000-0000-000000000018', 2),
  ('d0000000-0000-0000-0000-000000000019', 3),
  ('d0000000-0000-0000-0000-000000000020', 4),
  ('d0000000-0000-0000-0000-000000000021', 5),
  ('d0000000-0000-0000-0000-000000000022', 6),
  ('d0000000-0000-0000-0000-000000000023', 7),
  ('d0000000-0000-0000-0000-000000000024', 8),
  ('d0000000-0000-0000-0000-000000000025', 1),
  ('d0000000-0000-0000-0000-000000000026', 2),
  ('d0000000-0000-0000-0000-000000000027', 3),
  ('d0000000-0000-0000-0000-000000000028', 4),
  ('d0000000-0000-0000-0000-000000000029', 5),
  ('d0000000-0000-0000-0000-000000000030', 6),
  ('d0000000-0000-0000-0000-000000000031', 7),
  ('d0000000-0000-0000-0000-000000000032', 8),
  ('d0000000-0000-0000-0000-000000000033', 1),
  ('d0000000-0000-0000-0000-000000000034', 2),
  ('d0000000-0000-0000-0000-000000000035', 3),
  ('d0000000-0000-0000-0000-000000000036', 4),
  ('d0000000-0000-0000-0000-000000000037', 5),
  ('d0000000-0000-0000-0000-000000000038', 6),
  ('d0000000-0000-0000-0000-000000000039', 7),
  ('d0000000-0000-0000-0000-000000000040', 8),
  ('d0000000-0000-0000-0000-000000000041', 1),
  ('d0000000-0000-0000-0000-000000000042', 2),
  ('d0000000-0000-0000-0000-000000000043', 3),
  ('d0000000-0000-0000-0000-000000000044', 4),
  ('d0000000-0000-0000-0000-000000000045', 5),
  ('d0000000-0000-0000-0000-000000000046', 6),
  ('d0000000-0000-0000-0000-000000000047', 7),
  ('d0000000-0000-0000-0000-000000000048', 8),
  ('d0000000-0000-0000-0000-000000000049', 1),
  ('d0000000-0000-0000-0000-000000000050', 2),
  ('d0000000-0000-0000-0000-000000000051', 3),
  ('d0000000-0000-0000-0000-000000000052', 4),
  ('d0000000-0000-0000-0000-000000000053', 5),
  ('d0000000-0000-0000-0000-000000000054', 6),
  ('d0000000-0000-0000-0000-000000000055', 7),
  ('d0000000-0000-0000-0000-000000000056', 8),
  ('d0000000-0000-0000-0000-000000000057', 1),
  ('d0000000-0000-0000-0000-000000000058', 2),
  ('d0000000-0000-0000-0000-000000000059', 3),
  ('d0000000-0000-0000-0000-000000000060', 4),
  ('d0000000-0000-0000-0000-000000000061', 5),
  ('d0000000-0000-0000-0000-000000000062', 6),
  ('d0000000-0000-0000-0000-000000000063', 7),
  ('d0000000-0000-0000-0000-000000000064', 8),
  ('d0000000-0000-0000-0000-000000000065', 1),
  ('d0000000-0000-0000-0000-000000000066', 2),
  ('d0000000-0000-0000-0000-000000000067', 3),
  ('d0000000-0000-0000-0000-000000000068', 4),
  ('d0000000-0000-0000-0000-000000000069', 5),
  ('d0000000-0000-0000-0000-000000000070', 6),
  ('d0000000-0000-0000-0000-000000000071', 7),
  ('d0000000-0000-0000-0000-000000000072', 8),
  ('d0000000-0000-0000-0000-000000000073', 1),
  ('d0000000-0000-0000-0000-000000000074', 2),
  ('d0000000-0000-0000-0000-000000000075', 3),
  ('d0000000-0000-0000-0000-000000000076', 4),
  ('d0000000-0000-0000-0000-000000000077', 5),
  ('d0000000-0000-0000-0000-000000000078', 6),
  ('d0000000-0000-0000-0000-000000000079', 7),
  ('d0000000-0000-0000-0000-000000000080', 8)
on conflict (kudos_id, hashtag_id) do nothing;
