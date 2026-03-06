# 🚀 Quick Start - Supabase Storage Setup

Hướng dẫn nhanh để setup và sử dụng Supabase Storage cho video và tài liệu.

## ⚡ Setup (5 phút)

### 1. Cài đặt dependencies

```bash
cd backend
npm install    # multer đã có trong package.json
```

### 2. Khởi tạo Storage Buckets

```bash
npm run init-storage
```

Output mong đợi:

```
🚀 Initializing Supabase Storage Buckets...

✅ Created bucket: course-videos
✅ Created bucket: course-documents
✅ Created bucket: course-thumbnails

✅ Storage initialization completed!
```

### 3. Start Backend

```bash
npm run dev
```

---

## 🎯 API Quick Reference

### Upload Video

```bash
POST http://localhost:5000/api/upload/video
Headers: Authorization: Bearer <token>
Body: FormData { file, lectureId }
```

### Upload Document

```bash
POST http://localhost:5000/api/upload/document
Headers: Authorization: Bearer <token>
Body: FormData { file, lectureId }
```

### Upload Thumbnail

```bash
POST http://localhost:5000/api/upload/thumbnail
Headers: Authorization: Bearer <token>
Body: FormData { file, courseId }
```

---

## 📝 Frontend Example

```jsx
// Upload video
const uploadVideo = async (file, lectureId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lectureId", lectureId);

  const response = await fetch("http://localhost:5000/api/upload/video", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  console.log("Video URL:", data.data.url);
};
```

---

## 📚 Full Documentation

Xem [SUPABASE_STORAGE_GUIDE.md](SUPABASE_STORAGE_GUIDE.md) để biết chi tiết đầy đủ.

---

## ✅ Checklist

- [x] Đã install multer
- [x] Đã tạo storage service
- [x] Đã tạo upload controller
- [x] Đã tạo upload routes
- [ ] Chạy `npm run init-storage`
- [ ] Test upload từ Postman
- [ ] Integrate vào Frontend

---

## 🎬 Luồng Hoạt Động

```
User chọn file
    ↓
Frontend gửi FormData → POST /api/upload/video
    ↓
Backend (multer) nhận file → Buffer
    ↓
storageService.uploadVideo() → Supabase Storage
    ↓
Supabase trả URL
    ↓
Lưu URL vào LectureMaterial table
    ↓
Response URL về Frontend
```

---

## 🗄️ Database Structure

```sql
-- Video và Document lưu tại đây
LectureMaterial (
  LectureId UUID,
  Id INT,
  Type VARCHAR,      -- "video" hoặc "document"
  Url VARCHAR(255)   -- URL từ Supabase Storage
)

-- Thumbnail lưu vào Course
Courses (
  Id UUID,
  Title VARCHAR,
  ThumbUrl VARCHAR   -- URL từ Supabase Storage
)
```

---

## 🔥 Supported File Types

### Video

- MP4, MPEG, MOV, AVI
- Max: 100MB

### Document

- PDF, DOC, DOCX, PPT, PPTX, TXT
- Max: 100MB

### Image (Thumbnail)

- JPG, PNG, WEBP
- Max: 100MB

---

**Khởi động ngay:** `npm run init-storage` → `npm run dev` → Test với Postman! 🚀
