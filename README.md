<p align="center">
  <img src="frontend/public/logo.png" alt="FlyUp Logo" width="80" />
</p>

<h1 align="center">🚀 FlyUp – Online Learning Platform</h1>

<p align="center">
  <b>Nền tảng học trực tuyến hiện đại</b> được xây dựng bằng React, Express, Prisma & Supabase.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/Bundler-Vite%207-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/Styling-TailwindCSS%204-38B2AC?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Backend-Express%204-000000?logo=express" />
  <img src="https://img.shields.io/badge/ORM-Prisma%207-2D3748?logo=prisma" />
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase" />
</p>

---

## 📖 Giới thiệu

**FlyUp** là nền tảng giáo dục trực tuyến (EduTech) cho phép:

- 🎓 **Người học** – Duyệt, tìm kiếm và mua khóa học; theo dõi tiến trình học; quản lý wishlist.
- 👨‍🏫 **Giảng viên** – Tạo, quản lý và xuất bản khóa học với các bài giảng, section và quiz.
- 💳 **Thanh toán** – Tích hợp VNPay QR qua Casso webhook, hỗ trợ mã giảm giá (coupon).
- 🤖 **AI Chatbot** – Trợ lý AI tích hợp sẵn sử dụng Groq API.
- 🔐 **Xác thực** – Đăng nhập bằng email/password, Google OAuth, GitHub OAuth.

---

## 🏗️ Kiến trúc hệ thống

```
FlyUpProject/
├── backend/                 # Express.js API Server
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── routers/         # API routes
│   │   ├── services/        # Service layer
│   │   ├── middlewares/      # Auth, validation
│   │   ├── configs/         # Swagger, payment config
│   │   └── index.js         # Entry point
│   ├── prisma/              # Prisma schema & migrations
│   └── package.json
│
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── contexts/        # React Context (Auth, Cart)
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API service functions
│   │   └── App.jsx          # Root component
│   └── package.json
│
├── others/                  # Tài liệu, diagrams, mockups
├── package.json             # Root scripts (concurrently)
└── README.md
```

---

## 🛠️ Công nghệ sử dụng

| Layer        | Công nghệ                                      |
| ------------ | ---------------------------------------------- |
| **Frontend** | React 19, Vite 7, TailwindCSS 4, Framer Motion |
| **Backend**  | Node.js, Express 4, Prisma 7, Swagger          |
| **Database** | PostgreSQL (Supabase)                          |
| **Auth**     | JWT, Google OAuth, GitHub OAuth, bcrypt        |
| **Payment**  | VNPay QR (Casso webhook)                       |
| **AI**       | Groq API (Chatbot)                             |
| **Email**    | Nodemailer + Gmail API                         |
| **DevOps**   | GitHub Actions CI/CD                           |

---

## ⚡ Hướng dẫn chạy dự án

### 📋 Yêu cầu hệ thống

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**

### 1️⃣ Clone repository

```bash
git clone https://github.com/de180551chauvuonghoang-svg/FlyUpProject.git
cd FlyUpProject
```

### 2️⃣ Cài đặt dependencies

```bash
# Cài đặt root dependencies (concurrently)
npm install

# Cài đặt Backend dependencies
cd backend
npm install
cd ..

# Cài đặt Frontend dependencies
cd frontend
npm install
cd ..
```

### 3️⃣ Cấu hình môi trường (Environment Variables)

Tạo file `backend/.env` với nội dung sau (thay bằng giá trị thực tế của bạn):

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url

# Email (Gmail)
GMAIL_USER=your_gmail
GMAIL_PASS=your_app_password
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Payment
CASSO_SECURE_TOKEN=your_casso_token

# AI
GROQ_API_KEY=your_groq_api_key
```

Tạo file `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4️⃣ Khởi chạy dự án

```bash
# Chạy cả Backend + Frontend cùng lúc
npm run dev
```

Hoặc chạy riêng từng phần:

```bash
# Chỉ chạy Backend (port 5000)
npm run dev:backend

# Chỉ chạy Frontend (port 5173)
npm run dev:frontend
```

### 5️⃣ Truy cập ứng dụng

| Service         | URL                            |
| --------------- | ------------------------------ |
| 🌐 Frontend     | http://localhost:5173          |
| 🔧 Backend API  | http://localhost:5000/api      |
| 📚 Swagger Docs | http://localhost:5000/api-docs |

---

## ⚠️ Lưu ý quan trọng

### Port 5000 bị chiếm (EADDRINUSE)

Nếu gặp lỗi `Error: listen EADDRINUSE: address already in use :::5000`, chạy lệnh sau để giải phóng port:

```bash
npx kill-port 5000
```

Sau đó chạy lại `npm run dev`.

---

## 📁 Các tính năng chính

### 👤 Người học (Learner)

- Đăng ký / Đăng nhập (Email, Google, GitHub)
- Duyệt & tìm kiếm khóa học
- Thêm vào giỏ hàng / Thanh toán trực tiếp
- Quản lý Wishlist
- Theo dõi tiến trình học (My Learning)
- Xem lịch sử giao dịch

### 👨‍🏫 Giảng viên (Instructor)

- Dashboard quản lý khóa học
- Tạo / Sửa / Xóa khóa học
- Upload nội dung bài giảng
- Xem thống kê sinh viên & doanh thu

### 💳 Thanh toán

- Quét QR thanh toán qua VNPay
- Hỗ trợ mã giảm giá (Coupon)
- Xác nhận tự động qua Casso webhook

### 🤖 AI Features

- Chatbot tư vấn khóa học
- Smart suggestions

---

## 👥 Đội ngũ phát triển

| Thành viên | Vai trò |
| ---------- | ------- |
| Team FlyUp | SWP391  |

---

<p align="center">
  Made with ❤️ by <b>FlyUp Team</b> — FPT University
</p>
