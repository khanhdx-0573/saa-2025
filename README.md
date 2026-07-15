# Tổng Quan Dự Án

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Ngôn ngữ:** TypeScript (Strict mode)
- **Giao diện (Styling):** Tailwind CSS v4
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
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
