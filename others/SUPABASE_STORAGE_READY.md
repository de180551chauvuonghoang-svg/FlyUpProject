# ✅ Supabase Storage - Setup hoàn tất!

## 🎯 Đã hoàn thành

✅ **Buckets đã tạo:**

- `course-videos` - Lưu video bài giảng
- `course-documents` - Lưu tài liệu (PDF, DOC, PPT, etc.)
- `course-thumbnails` - Lưu thumbnail khóa học

✅ **Backend code:**

- Storage Service (upload/delete files)
- Upload Controller (API handlers)
- Upload Routes (endpoints)
- Multer integration (file upload middleware)

✅ **Configuration:**

- Supabase credentials trong `.env`
- File size limit: 100MB (free tier)

---

## 🚀 Sử dụng ngay

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Test Upload với Postman

#### Upload Video

```
POST http://localhost:5000/api/upload/video
Headers:
  Authorization: Bearer <your_jwt_token>
  Content-Type: multipart/form-data

Body (form-data):
  file: [chọn file video .mp4]
  lectureId: <lecture_uuid> (optional)
```

#### Upload Document

```
POST http://localhost:5000/api/upload/document
Body (form-data):
  file: [chọn file .pdf/.doc]
  lectureId: <lecture_uuid> (optional)
```

#### Upload Thumbnail

```
POST http://localhost:5000/api/upload/thumbnail
Body (form-data):
  file: [chọn file .jpg/.png]
  courseId: <course_uuid> (optional)
```

---

## 📋 API Endpoints Available

| Method | Endpoint                              | Mục đích                |
| ------ | ------------------------------------- | ----------------------- |
| POST   | `/api/upload/video`                   | Upload video            |
| POST   | `/api/upload/document`                | Upload tài liệu         |
| POST   | `/api/upload/thumbnail`               | Upload ảnh thumbnail    |
| GET    | `/api/upload/lecture/:id/materials`   | Lấy danh sách materials |
| DELETE | `/api/upload/material/:lectureId/:id` | Xóa material            |

---

## 💾 Database Structure

### LectureMaterial (Video & Documents)

```sql
LectureId: UUID
Id: Integer (auto-increment)
Type: String ("video" hoặc "document")
Url: String (URL từ Supabase Storage)
```

### Courses (Thumbnail)

```sql
ThumbUrl: String (URL từ Supabase Storage)
```

---

## 🎬 Ví dụ Frontend React

```jsx
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
  // Lưu URL này hoặc hiển thị video player
};
```

---

## 📊 File Limits

| Type     | Max Size | Formats                        |
| -------- | -------- | ------------------------------ |
| Video    | 100MB    | MP4, MPEG, MOV, AVI            |
| Document | 100MB    | PDF, DOC, DOCX, PPT, PPTX, TXT |
| Image    | 100MB    | JPG, PNG, WEBP                 |

> **Note:** Supabase Free Tier có 1GB storage tổng cộng

---

## 🔍 Kiểm tra Buckets

Vào Supabase Dashboard:

1. Truy cập: https://supabase.com/dashboard
2. Chọn project: `wmiyvcxniyslyweulihf`
3. Storage → Buckets
4. Bạn sẽ thấy 3 buckets đã tạo

---

## 📚 Documentation đầy đủ

- [SUPABASE_STORAGE_GUIDE.md](SUPABASE_STORAGE_GUIDE.md) - Hướng dẫn chi tiết
- [SUPABASE_STORAGE_QUICKSTART.md](SUPABASE_STORAGE_QUICKSTART.md) - Quick start

---

## ✅ Next Steps

1. **Start backend:** `npm run dev`
2. **Test upload** với Postman/Insomnia
3. **Integrate vào Frontend** (InstructorUploadPage)
4. **Test full flow:** Upload → Save to DB → Display

---

## 🐛 Troubleshooting

### Lỗi "File too large"

- Max 100MB/file (Supabase free tier)
- Compress video trước khi upload

### Lỗi "Invalid token"

- Check JWT token còn hạn không
- Check Authorization header: `Bearer <token>`

### Lỗi "Bucket not found"

- Chạy lại: `npm run init-storage`

---

**🎉 Bây giờ bạn có thể upload video và tài liệu lên Supabase Storage!**

Hãy test ngay với Postman hoặc integrate vào frontend! 🚀
