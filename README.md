# Tổng Quan Dự Án

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Ngôn ngữ:** TypeScript (Strict mode)
- **Giao diện (Styling):** Tailwind CSS v4
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
- **Hosting:** Vercel
- **Đa ngôn ngữ (i18n):** next-intl
- **Soạn thảo văn bản (Rich Text Editor):** Tiptap
- **Kiểm thử (Testing):** Vitest + Testing Library (Unit Test) và Playwright (E2E Test)

---

## 🚀 Cài Đặt Ban Đầu (Installation)

**Yêu cầu hệ thống:**
- Node.js (phiên bản 20 trở lên)
- npm, yarn, pnpm hoặc bun
- Docker Desktop (để chạy Supabase local)

**1. Cài đặt các thư viện (dependencies):**
```bash
npm install
```

**2. Thiết lập biến môi trường:**
Tạo file `.env.local` dựa trên file `.env` có sẵn (nếu có) và điền các thông tin xác thực cần thiết, đặc biệt là các biến môi trường cho Supabase.
```bash
cp .env .env.local
```

---

## 🛠️ Cách Chạy Dự Án (Running the Project)

### 1. Khởi động Supabase (Local)
Dự án sử dụng Supabase CLI để chạy cơ sở dữ liệu và các dịch vụ khác ở môi trường local.
```bash
npx supabase start
```
Sau khi khởi động thành công, chạy lệnh sau để áp dụng các thay đổi về schema của cơ sở dữ liệu (migrations):
```bash
npx supabase migration up --local
```

### 2. Khởi động Môi Trường Phát Triển (Development Server)
```bash
npm run dev
```
Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để bắt đầu phát triển. Giao diện sẽ tự động cập nhật mỗi khi bạn lưu file.

---

## 🧪 Kiểm Thử (Testing)

Dự án yêu cầu mọi tính năng (feature) đều phải được kiểm thử qua hai bước: Unit Test và E2E Test.

### 1. Chạy Unit Test (Vitest)
Unit test được sử dụng để kiểm tra các xử lý logic thuần, validation, và hooks.
```bash
npm run test
```

### 2. Chạy E2E Test (Playwright)
End-to-End Test đảm bảo người dùng có thể thao tác đúng các luồng trên giao diện thực tế.
*Lưu ý: Kịch bản test E2E (`npm run test:e2e`) sẽ tự động build ứng dụng (`next build`) và chạy server (`next start`) để test nhằm đảm bảo tính chính xác và phòng tránh các lỗi liên quan đến HMR trong môi trường dev của Next.js 16.2.*
```bash
npm run test:e2e
```

---

## 📦 Các Lệnh Hữu Ích Khác (Scripts)

- `npm run build`: Đóng gói (build) dự án sẵn sàng cho production.
- `npm run start`: Chạy ứng dụng từ bản build production.
- `npm run lint`: Chạy ESLint để kiểm tra và phát hiện lỗi cú pháp, style code.

---

## 🚀 Deploy (Supabase Local → Cloud)

### 1. Tạo project trên Supabase Cloud

1. Vào https://supabase.com/dashboard → **New Project**.
2. Chọn Organization → đặt tên project → tạo database password (lưu lại, dùng ở bước link) → chọn Region (gần user thật nhất, ví dụ Singapore) → **Create new project**.
3. Đợi 1–2 phút để project khởi tạo.

### 2. Lấy project ref

- Nhìn trên URL dashboard: `https://supabase.com/dashboard/project/<ref>` → chuỗi 20 ký tự đó là ref.
- Hoặc: Settings → General → **Reference ID**.

### 3. Link local project với cloud

```bash
supabase link --project-ref <ref>
```
Nhập database password đã tạo ở bước 1 khi được hỏi.

### 4. Đẩy schema + RLS + bucket (nếu tạo qua migration) lên cloud

```bash
supabase db push
```
- Đẩy toàn bộ file trong `supabase/migrations` lên cloud (bảng, RLS policy, function, trigger).
- Muốn xem trước thay đổi trước khi áp dụng: thêm `--dry-run`.

**Seed dữ liệu mẫu lên cloud (tùy chọn, dùng để demo):**

```bash
supabase db push --include-seed
```
- Chạy thêm `supabase/seed.sql` (đã cấu hình trong `config.toml` → `[db.seed]`) lên remote DB, ngay sau khi đẩy migrations.
- File `seed.sql` dùng `on conflict do nothing` nên chạy lại nhiều lần không tạo trùng lặp.
- Dữ liệu trong `seed.sql` là data giả (`@seed.local`) để demo — không seed lên cloud production thật có user thật.

### 5. Cấu hình Site URL / Redirect URLs (bắt buộc nếu có Auth/login)

Dashboard cloud → **Authentication → URL Configuration**:
- **Site URL**: `https://yourapp.com` (domain production thật)
- **Redirect URLs**: thêm `https://yourapp.com/**`

### 6. Cấu hình Google OAuth (nếu dùng login Google)

**Bên Google Cloud Console** (APIs & Services → Credentials → chọn OAuth Client đang dùng cho local):
- Thêm vào **Authorized redirect URIs**: `https://<ref>.supabase.co/auth/v1/callback`
- Thêm vào **Authorized JavaScript origins**: `https://yourapp.com`
- Không cần tạo Client mới — dùng chung 1 client cho cả local và cloud, chỉ thêm URL.

**Bên Supabase Dashboard cloud** → Authentication → Providers → Google:
- Dán đúng Client ID + Client Secret (giống hệt trong `.env` local) → Enable → Save.

### 7. Storage buckets (chỉ nếu bucket được tạo TAY ở local, không qua migration)

Dashboard cloud → Storage → **New Bucket** → tạo lại đúng tên, đúng chế độ public/private như local.
(Nếu bucket được tạo bằng SQL trong migration thì bước 4 đã lo rồi, bỏ qua.)

### 8. Edge Functions (nếu project có dùng)

```bash
supabase functions deploy <tên-function>
supabase secrets set --env-file .env.production
```
Không dùng Edge Function thì bỏ qua bước này.

### 9. Lấy API keys cho cloud

Dashboard cloud → Settings → API:
- **Project URL**
- **Publishable key** (anon/public key)

### 10. Cập nhật env cho Next.js app

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key-vừa-lấy>
```
Set biến này trên nơi bạn deploy Next.js (Vercel Environment Variables, hoặc `.env.production` nếu tự host).

### 11. Deploy Next.js app

Deploy như bình thường (Vercel, self-host, v.v). Sau khi deploy, test lại:
- Load trang, query data (kiểm tra RLS không chặn nhầm)
- Login Google (kiểm tra redirect không lỗi)
- Upload/xem file nếu có dùng storage

### Lưu ý về `config.toml`

- File này mặc định **chỉ ảnh hưởng local** (`supabase start`), không tự áp dụng lên cloud.
- Riêng mục `[auth]` (site_url, redirect urls, OAuth providers...) *có thể* đẩy lên cloud bằng `supabase config push`, nhưng dễ ghi đè nhầm site_url cloud thành `localhost` nếu không tách config theo môi trường — nên với project nhỏ, **set tay trên Dashboard (bước 5, 6) là cách an toàn và đơn giản hơn**.

### Việc chỉ cần làm 1 lần

Bước 1, 2, 5, 6, 9 chỉ làm 1 lần lúc setup ban đầu. Từ lần deploy sau, mỗi khi code có migration mới, chỉ cần lặp lại bước 4 (`supabase db push`).

---

## 🌐 Deploy Ứng Dụng (Vercel)

> App được host trên Vercel, tự động build lại mỗi khi có thay đổi trên GitHub. Phần dưới đây bổ sung chi tiết cho bước 11 (Deploy Next.js app) ở checklist Supabase phía trên — làm sau khi đã hoàn tất checklist đó.

### 1. Cơ chế build tự động

- Push lên nhánh `main` → build và deploy thẳng lên **Production**.
- Mở Pull Request → Vercel tự tạo **Preview Deployment** riêng cho PR đó để review trước khi merge.

### 2. Biến môi trường

Vercel Dashboard → **Settings → Environment Variables** → điền 2 biến đã lấy ở bước 9–10 của checklist Supabase phía trên (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

### 3. Domain riêng (Custom Domain)

- Domain: `app.yourapp.com`
- DNS: quản lý qua Route 53 → trỏ CNAME `app` về hostname mà Vercel cấp khi add domain.
- Environment gán cho domain: **Production**.
