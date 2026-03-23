# 📚 FlyUp - Dự Án Nền Tảng Giáo Dục Trực Tuyến

## 🎯 Tổng Quan Dự Án

**FlyUp** là một nền tảng giáo dục trực tuyến (EduTech Platform) hoàn chỉnh, cho phép:
- Giảng viên (Instructor) tạo, quản lý và cập nhật khóa học
- Học viên (Student) đăng ký, học tập và hoàn thành khóa học
- Quản lý thanh toán, giỏ hàng và đăng ký khóa học
- Hệ thống quiz/assignment với CAT (Computer Adaptive Testing)
- Upload và quản lý video, tài liệu học tập
- Tương tác qua bình luận, đánh giá và chia sẻ

**GitHub Repository:** https://github.com/de180551chauvuonghoang-svg/FlyUpProject

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js với Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Storage:** Supabase Storage
- **Authentication:** JWT + Google OAuth
- **Email:** Nodemailer, Resend
- **File Upload:** Multer
- **Validation:** Express Validator
- **Cache:** Node-Cache

### Frontend
- **Framework:** React 19 với Vite
- **Routing:** React Router DOM v7
- **State Management:** React Query (TanStack Query)
- **Styling:** TailwindCSS + DaisyUI
- **UI Components:** Lucide React Icons
- **Animation:** Framer Motion
- **Authentication:** @react-oauth/google
- **QR Code:** qrcode.react
- **Toast Notifications:** React Hot Toast

### DevOps & Tools
- **Version Control:** Git
- **API Testing:** Postman (collections included)
- **Diagram:** Mermaid, Prisma ERD Generator
- **Concurrent Dev:** Concurrently

---

## 📂 Cấu Trúc Dự Án

```
FlyUpProject/
├── backend/                       # Backend API (Node.js + Express)
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── src/
│   │   ├── index.js              # Entry point
│   │   ├── configs/              # Cấu hình (Supabase, etc.)
│   │   ├── controllers/          # Business logic handlers
│   │   │   ├── authController.js
│   │   │   ├── courseController.js
│   │   │   ├── paymentController.js
│   │   │   ├── uploadController.js
│   │   │   └── ...
│   │   ├── services/             # Business logic services
│   │   ├── routers/              # API routes
│   │   ├── middleware/           # Auth & validation
│   │   └── utils/                # Helper functions
│   └── scripts/                  # Utility scripts
│       ├── setup-instructor.js
│       ├── init-storage.js
│       ├── add-sample-lectures.js
│       └── ...
│
├── frontend/                      # Frontend App (React + Vite)
│   ├── src/
│   │   ├── main.jsx              # Entry point
│   │   ├── App.jsx               # App component
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── contexts/             # React contexts
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # API services
│   │   ├── utils/                # Helper functions
│   │   └── config/               # Configuration
│   └── public/                   # Static assets
│
├── *.md                          # Documentation files
├── package.json                  # Root package config
├── CourseHubDB.sql               # Database dump
└── supabase_migration.sql        # Supabase migration

```

---

## 🗄️ Database Schema

### Core Models

#### Users
- **Roles:** Student, Instructor, Admin
- **Authentication:** Email/Password, Google OAuth
- **Profile:** Avatar, phone, birthday, gender
- **Status:** Active, Inactive, Banned

#### Courses
- **Attributes:** Title, description, price, level, status
- **Relations:** Instructor, Categories, Sections, Enrollments
- **Media:** ThumbUrl (thumbnail), intro video
- **Stats:** View count, rating, total duration

#### Sections & Lectures
- **Sections:** Organized course content
- **Lectures:** Individual lessons with title, description, video URL, order
- **Materials:** Documents, videos, resources per lecture

#### Enrollments
- **Tracks:** Student progress in courses
- **Completion:** Lecture completions, quiz results
- **Status:** Active, Completed, Cancelled

#### Assignments & Quizzes
- **MCQ Questions:** Multiple choice with difficulty (IRT)
- **CAT System:** Adaptive testing algorithm
- **Submissions:** Student answers and grading
- **Results:** Scores, theta values, completion time

#### Payments
- **Bills:** Transaction records
- **Cart Checkout:** Multi-course purchase
- **Coupons:** Discount codes (percentage/fixed)
- **Payment Methods:** VNPay, Momo, Bank transfer

#### Social Features
- **Comments:** Nested comments on lectures/articles
- **Reviews:** Course ratings and feedback
- **Wishlist:** Save courses for later
- **Reactions:** Like/dislike on articles

---

## ✨ Tính Năng Chính

### 🎓 Cho Giảng Viên (Instructor)

1. **Quản lý Khóa Học**
   - Tạo khóa học mới với thông tin chi tiết
   - Cập nhật khóa học cũ (title, price, sections, lectures)
   - Upload thumbnail, video intro
   - Quản lý trạng thái (Draft, Published, Archived)

2. **Quản lý Nội Dung**
   - Tạo sections và lectures
   - Upload video bài giảng (Supabase Storage)
   - Upload tài liệu học tập (PDF, DOC, PPT)
   - Sắp xếp thứ tự sections/lectures

3. **Quản lý Quiz & Assignment**
   - Tạo bài kiểm tra với MCQ
   - Cấu hình độ khó, thời gian, điểm đạt
   - Xem kết quả và phân tích học viên

4. **Preview Khóa Học**
   - Xem trước khóa học như học viên
   - Kiểm tra nội dung trước khi publish

### 👨‍🎓 Cho Học Viên (Student)

1. **Tìm Kiếm & Đăng Ký**
   - Browse courses theo category
   - Tìm kiếm courses
   - Xem chi tiết course và preview
   - Thêm vào wishlist

2. **Thanh Toán**
   - Giỏ hàng (cart checkout) - mua nhiều khóa học
   - Áp dụng coupon/mã giảm giá
   - Thanh toán qua VNPay, Momo
   - Xem lịch sử giao dịch

3. **Học Tập**
   - Xem video bài giảng
   - Download tài liệu học tập
   - Đánh dấu lecture đã hoàn thành
   - Track tiến độ học tập

4. **Kiểm Tra**
   - Làm quiz/assignment
   - CAT (Computer Adaptive Testing) - câu hỏi điều chỉnh theo khả năng
   - Xem kết quả và feedback
   - Retake assignments

5. **Tương Tác**
   - Comment trên lecture
   - Review và rate courses
   - Share courses (QR code, social media)
   - Follow instructors

### 🔐 Authentication & Authorization

- **Login/Register:** Email/Password
- **Google OAuth:** Đăng nhập bằng Google
- **JWT Token:** Secure API authentication
- **Role-based Access:** Student, Instructor, Admin
- **Email Verification:** Xác thực email khi đăng ký

### 📁 File Upload & Storage

- **Supabase Storage Buckets:**
  - `course-videos`: Video bài giảng (MP4, up to 100MB)
  - `course-documents`: Tài liệu (PDF, DOC, PPT, etc.)
  - `course-thumbnails`: Ảnh thumbnail khóa học

- **Upload API:** REST endpoints với multipart/form-data
- **Security:** JWT authentication required
- **URL Management:** Public URLs from Supabase

### 🎯 Advanced Features

- **CAT Algorithm:** Adaptive testing dựa trên IRT (Item Response Theory)
- **Progress Tracking:** Track lecture completions, quiz scores
- **Discount System:** Coupons with usage limits and expiry
- **Email Notifications:** Welcome emails, enrollment confirmations
- **View Counter:** Track course views
- **Search & Filter:** Advanced course search

---

## 🚀 Hướng Dẫn Cài Đặt

### Prerequisites

- Node.js (v18 trở lên)
- PostgreSQL (v14 trở lên)
- Supabase Account (for storage)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/de180551chauvuonghoang-svg/FlyUpProject.git
cd FlyUpProject
```

### 2. Setup Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Copy và cấu hình .env
cp .env.example .env

# Cấu hình DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_KEY, etc.

# Migrate database
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# (Optional) Seed database
npm run setup-instructor
npm run init-storage
```

### 3. Setup Frontend

```bash
# Di chuyển vào thư mục frontend
cd ../frontend

# Cài đặt dependencies
npm install

# Copy và cấu hình .env
cp .env.example .env

# Cấu hình VITE_API_URL, VITE_GOOGLE_CLIENT_ID, etc.
```

### 4. Run Development

#### Chạy từng server riêng:

```bash
# Terminal 1 - Backend
cd backend
npm run dev        # Chạy trên port 5000

# Terminal 2 - Frontend
cd frontend
npm run dev        # Chạy trên port 5173
```

#### Hoặc chạy đồng thời:

```bash
# Từ root directory
npm install        # Cài concurrently
npm run dev        # Chạy cả backend và frontend
```

### 5. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Docs:** http://localhost:5000/api

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

```
POST   /api/auth/register          # Đăng ký tài khoản
POST   /api/auth/login             # Đăng nhập
POST   /api/auth/google            # Google OAuth login
POST   /api/auth/refresh           # Refresh JWT token
GET    /api/auth/profile           # Lấy thông tin user
PUT    /api/auth/profile           # Cập nhật profile
```

### Courses (`/api/courses`)

```
GET    /api/courses                # Danh sách courses (public)
GET    /api/courses/:id            # Chi tiết course
POST   /api/courses                # Tạo course mới (instructor)
PUT    /api/courses/:id/update     # Cập nhật course (instructor)
DELETE /api/courses/:id            # Xóa course (instructor)
GET    /api/courses/:id/sections   # Lấy sections của course
POST   /api/courses/:id/sections   # Tạo section mới
GET    /api/courses/:id/progress   # Tiến độ học của user
```

### Enrollments

```
POST   /api/courses/:id/enroll     # Đăng ký khóa học
GET    /api/enrollments             # Khóa học đã đăng ký
POST   /api/lectures/:id/complete  # Đánh dấu lecture hoàn thành
```

### Upload (`/api/upload`)

```
POST   /api/upload/video           # Upload video (multipart)
POST   /api/upload/document        # Upload document (multipart)
POST   /api/upload/thumbnail       # Upload thumbnail (multipart)
GET    /api/upload/lecture/:id/materials  # Lấy materials của lecture
DELETE /api/upload/material/:lectureId/:id  # Xóa material
```

### Payments & Checkout (`/api/checkout`, `/api/transactions`)

```
POST   /api/checkout               # Tạo cart checkout
GET    /api/checkout/verify        # Verify payment callback
POST   /api/checkout/vnpay         # VNPay payment
POST   /api/checkout/momo          # Momo payment
GET    /api/transactions           # Lịch sử giao dịch
```

### Quiz & Assignments (`/api/quiz`)

```
GET    /api/quiz/assignment/:id    # Lấy assignment
POST   /api/quiz/submit            # Submit bài làm
GET    /api/quiz/results/:id       # Xem kết quả
POST   /api/quiz/cat/start         # Bắt đầu CAT test
POST   /api/quiz/cat/answer        # Trả lời câu hỏi CAT
```

### Comments (`/api/comments`)

```
GET    /api/comments/lecture/:id   # Comments của lecture
POST   /api/comments               # Tạo comment
PUT    /api/comments/:id           # Cập nhật comment
DELETE /api/comments/:id           # Xóa comment
```

### Wishlist (`/api/wishlist`)

```
GET    /api/wishlist               # Danh sách wishlist
POST   /api/wishlist/:courseId     # Thêm vào wishlist
DELETE /api/wishlist/:courseId     # Xóa khỏi wishlist
```

### Users (`/api/users`)

```
GET    /api/users/:id              # Thông tin user
GET    /api/users/:id/courses      # Courses của instructor
POST   /api/users/follow/:id       # Follow user
```

---

## 📜 Scripts Có Sẵn

### Backend Scripts (`backend/scripts/`)

```bash
# Setup instructor account
npm run setup-instructor

# Initialize Supabase storage buckets
npm run init-storage

# Add sample data
node scripts/add-sample-lectures.js
node scripts/add-java-mcq.js
node scripts/add-lecture-materials-java.js

# Check data
node scripts/check-java-course.js
node scripts/check-java-videos.js

# Update data
node scripts/update-java-course.js
node scripts/fix-video-urls.js

# Test API
node scripts/test-api-response.js
node scripts/test-instructor-api.js
```

---

## 📚 Documentation Files

Dự án có sẵn nhiều file documentation chi tiết:

### Quick Start
- **START_HERE.md** - Bắt đầu nhanh với dự án
- **DATABASE_README.md** - Hướng dẫn database setup
- **SUPABASE_STORAGE_READY.md** - Storage setup guide

### Feature Guides
- **INSTRUCTOR_UPLOAD_GUIDE.md** - Hướng dẫn upload cho instructor
- **INSTRUCTOR_UPDATE_COURSE_GUIDE.md** - Cập nhật khóa học
- **INSTRUCTOR_PREVIEW_GUIDE.md** - Preview khóa học
- **LEARNING_PAGE_GUIDE.md** - Trang học tập
- **LECTURE_MATERIALS_GUIDE.md** - Quản lý tài liệu

### Technical Guides
- **COURSE_PUBLISHING_GUIDE.md** - Publish courses
- **COURSE_UPDATE_IMPLEMENTATION_REPORT.md** - Technical report
- **COURSE_UPDATE_FRONTEND_GUIDE.md** - Frontend implementation
- **COURSE_UPDATE_TESTING_GUIDE.md** - Testing guide
- **DEBUGGING_GUIDE.md** - Debug common issues
- **LOGIN_DEBUG_GUIDE.md** - Authentication debugging

### Feature Documentation
- **CART_CHECKOUT_FLOW.md** - Cart & checkout flow
- **SHARE_FEATURE_README.md** - Share feature documentation
- **SUPABASE_STORAGE_GUIDE.md** - Complete storage guide
- **SUPABASE_MIGRATION_GUIDE.md** - Database migration

### Performance & Reference
- **PERFORMANCE.md** - Performance optimization
- **COURSE_UPDATE_QUICK_REFERENCE.md** - Quick API reference
- **COURSE_UPDATE_SUMMARY.md** - Feature summary

---

## 🔧 Configuration

### Backend Environment Variables (`.env`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/coursehub"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email
EMAIL_FROM="noreply@flyup.com"
RESEND_API_KEY="your-resend-key"

# Payment
VNPAY_TMN_CODE="your-vnpay-code"
VNPAY_HASH_SECRET="your-vnpay-secret"
MOMO_PARTNER_CODE="your-momo-code"
MOMO_ACCESS_KEY="your-momo-key"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### Frontend Environment Variables (`.env`)

```env
# API
VITE_API_URL="http://localhost:5000"

# Supabase
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Google OAuth
VITE_GOOGLE_CLIENT_ID="your-google-client-id"

# App
VITE_APP_NAME="FlyUp"
VITE_APP_URL="http://localhost:5173"
```

---

## 🧪 Testing

### Using Postman

Import collection:
```
FlyUp_JWT_Tests.postman_collection.json
```

### Manual Testing

1. **Register Account:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User",
    "role": "student"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

3. **Access Protected Route:**
```bash
curl -X GET http://localhost:5000/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🏗️ Database Management

### Prisma Commands

```bash
# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Generate ERD
npx prisma generate
# ERD will be at backend/ERD.svg
```

### Database Import

```bash
# Import initial database
psql -U username -d coursehub < CourseHubDB_utf8.sql

# Import Supabase migration
psql -U username -d coursehub < supabase_migration.sql
```

---

## 🎨 Frontend Structure

### Key Components

```
components/
├── CourseCard.jsx           # Course display card
├── CourseUpdateForm.jsx     # Update course form
├── LecturePlayer.jsx        # Video player
├── QuizComponent.jsx        # Quiz interface
├── CommentSection.jsx       # Comments
├── CartCheckout.jsx         # Checkout flow
└── ShareButton.jsx          # Share functionality
```

### Pages

```
pages/
├── Home.jsx                 # Landing page
├── CourseDetail.jsx         # Course details
├── CourseLearning.jsx       # Learning interface
├── InstructorDashboard.jsx  # Instructor panel
├── StudentDashboard.jsx     # Student panel
├── Checkout.jsx             # Payment page
└── Auth/
    ├── Login.jsx
    └── Register.jsx
```

### Services

```
services/
├── api.js                   # Axios instance
├── authService.js           # Authentication
├── courseService.js         # Course APIs
├── uploadService.js         # File upload
└── paymentService.js        # Payment APIs
```

---

## 🔐 Security Features

- **JWT Authentication:** Secure token-based auth
- **Password Hashing:** bcryptjs
- **Input Validation:** Express Validator
- **SQL Injection Prevention:** Prisma ORM
- **XSS Protection:** React auto-escaping
- **CORS Configuration:** Controlled origins
- **File Upload Validation:** Type and size limits
- **Rate Limiting:** Prevent abuse
- **Environment Variables:** Sensitive data protection

---

## 📊 Database Diagram

Generate ERD using Prisma:

```bash
cd backend
npx prisma generate
# View ERD at backend/ERD.svg

# Or generate Mermaid diagram
# View CHEN_ERD.mmd
```

---

## 🚢 Deployment

### Backend (Node.js)

Recommended platforms:
- **Heroku:** Easy deployment
- **Railway:** Modern platform
- **Render:** Free tier available
- **AWS EC2:** Full control
- **DigitalOcean:** Droplets

### Frontend (React)

Recommended platforms:
- **Vercel:** Optimized for Vite (vercel.json included)
- **Netlify:** Simple deployment
- **Cloudflare Pages:** Fast CDN
- **AWS S3 + CloudFront:** Scalable

### Database

- **Supabase:** Managed PostgreSQL (recommended)
- **Railway:** PostgreSQL hosting
- **AWS RDS:** Production-ready
- **Heroku Postgres:** Easy integration

---

## 🐛 Common Issues & Solutions

### 1. Database Connection Error

```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
sudo service postgresql start

# Test connection
npx prisma db pull
```

### 2. Supabase Upload Error

```bash
# Verify SUPABASE_URL and SUPABASE_KEY
# Check bucket exists and is public
# Run init-storage script
npm run init-storage
```

### 3. JWT Authentication Failed

```bash
# Check JWT_SECRET is set
# Verify token format: "Bearer <token>"
# Check token expiry
```

### 4. Frontend API Connection

```bash
# Check VITE_API_URL in frontend/.env
# Ensure backend is running
# Check CORS configuration in backend
```

Xem thêm: [DEBUGGING_GUIDE.md](DEBUGGING_GUIDE.md), [LOGIN_DEBUG_GUIDE.md](LOGIN_DEBUG_GUIDE.md)

---

## 📈 Future Enhancements

### Planned Features
- Live streaming classes
- Real-time chat during lectures
- Mobile apps (React Native)
- Advanced analytics dashboard
- Certificate generation
- Multi-language support
- AI-powered recommendations
- Peer-to-peer learning
- Gamification (badges, points)
- Advanced search with Elasticsearch

### Technical Improvements
- Redis caching
- WebSocket for real-time features
- Microservices architecture
- GraphQL API
- Docker containerization
- CI/CD pipeline
- Automated testing suite
- Performance monitoring

---

## 👥 Team & Contributors

- **GitHub Repository:** https://github.com/de180551chauvuonghoang-svg/FlyUpProject
- **Contact:** [Add contact info]

---

## 📄 License

[Add license information]

---

## 🙏 Acknowledgments

- **Prisma** - Database ORM
- **Supabase** - Storage and authentication
- **TailwindCSS** - UI styling
- **React** - Frontend framework
- **Express** - Backend framework

---

## 📞 Support

Nếu gặp vấn đề hoặc có câu hỏi:

1. Đọc documentation files trong project
2. Check [DEBUGGING_GUIDE.md](DEBUGGING_GUIDE.md)
3. Review error logs in console
4. Open GitHub Issues
5. Contact team members

---

**Happy Coding! 🚀**

Last Updated: March 2, 2026
