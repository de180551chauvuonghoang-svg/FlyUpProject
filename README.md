<p align="center">
  <img src="frontend/public/logo.png" alt="FlyUp Logo" width="80" />
</p>

<h1 align="center">🚀 FlyUp – Online Learning Platform</h1>

<p align="center">
  <b>Modern Online Learning Platform</b> built with React, Express, Prisma & Supabase.
  <br />
  <i>Nền tảng học trực tuyến hiện đại được xây dựng bằng React, Express, Prisma & Supabase.</i>
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

## 📖 Introduction / Giới thiệu

**FlyUp** is an EduTech platform that enables:

- 🎓 **Learners** – Browse, search, and buy courses; track progress; manage wishlist.
- 👨‍🏫 **Instructors** – Create, manage, and publish courses with lectures, sections, and quizzes.
- 💳 **Payment** – Integrated VNPay QR via Casso webhook, support for coupons.
- 🤖 **AI Chatbot** – Built-in AI assistant using Groq API.
- 🔐 **Authentication** – Email/password login, Google OAuth, GitHub OAuth.

---

## 🏗️ System Architecture / Kiến trúc hệ thống

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
├── others/                  # Docs, diagrams, mockups
├── package.json             # Root scripts (concurrently)
└── README.md
```

---

## 🛠️ Tech Stack / Công nghệ sử dụng

| Layer        | Technology                                     |
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

## ⚡ Quick Start / Hướng dẫn chạy dự án

### 📋 Prerequisites / Yêu cầu hệ thống

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**

### 1️⃣ Clone repository

```bash
git clone https://github.com/de180551chauvuonghoang-svg/FlyUpProject.git
cd FlyUpProject
```

### 2️⃣ Install dependencies

```bash
# Install root dependencies
npm install

# Install Backend dependencies
cd backend && npm install && cd ..

# Install Frontend dependencies
cd frontend && npm install && cd ..
```

### 3️⃣ Environment Variables / Cấu hình môi trường

Create `backend/.env` (refer to `docs/deployment-guide.md` for templates).
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4️⃣ Run the Project

```bash
npm run dev
```

---

## 📁 Key Features / Tính năng chính

### 👤 Learners
- Course browsing, Cart, Wishlist, Learning progress, Transaction history.

### 👨‍🏫 Instructors
- Course management dashboard, Content upload, Analytics.

### 💳 Payment & AI
- VNPay QR, Coupons, Casso webhook, AI Chatbot assistant.

---

## 👥 Team
- Team FlyUp — SWP391 — FPT University

