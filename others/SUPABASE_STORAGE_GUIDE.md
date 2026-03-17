# Supabase Storage Guide - FlyUp

Hướng dẫn upload video, tài liệu và hình ảnh sử dụng **Supabase Storage** trong FlyUp Project.

## 📋 Mục Lục

1. [Cấu hình](#cấu-hình)
2. [Cài đặt](#cài-đặt)
3. [Cấu trúc Storage](#cấu-trúc-storage)
4. [API Endpoints](#api-endpoints)
5. [Sử dụng từ Frontend](#sử-dụng-từ-frontend)
6. [Testing](#testing)

---

## 🔧 Cấu Hình

### 1. Environment Variables

Thêm các biến môi trường trong `backend/.env`:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Khởi tạo Storage Buckets

Chạy lệnh để tạo các buckets cần thiết:

```bash
cd backend
npm run init-storage
```

Script này sẽ tạo 3 buckets:

- `course-videos` - Lưu video bài giảng
- `course-documents` - Lưu tài liệu (PDF, DOC, PPT, etc.)
- `course-thumbnails` - Lưu thumbnail khóa học

---

## 📦 Cài Đặt

### Backend Dependencies

```bash
cd backend
npm install multer
```

Package `multer` đã được thêm vào `package.json` để xử lý multipart/form-data.

---

## 🗂️ Cấu Trúc Storage

### Database Schema

#### Bảng `LectureMaterial`

```prisma
model LectureMaterial {
  LectureId String   @db.Uuid
  Id        Int      @default(autoincrement())
  Type      String   // "video" | "document"
  Url       String   @db.VarChar(255)
  Lectures  Lectures @relation(fields: [LectureId])
}
```

#### Bảng `Courses`

```prisma
model Courses {
  Id       String @id @default(dbgenerated("uuid_generate_v4()"))
  Title    String
  ThumbUrl String @default("")  // URL từ Supabase Storage
  // ...
}
```

### Storage Buckets

| Bucket              | Mục đích         | Giới hạn   | Public |
| ------------------- | ---------------- | ---------- | ------ |
| `course-videos`     | Video bài giảng  | 100MB/file | ✅ Yes |
| `course-documents`  | Tài liệu học tập | 100MB/file | ✅ Yes |
| `course-thumbnails` | Ảnh thumbnail    | 100MB/file | ✅ Yes |

---

## 🔌 API Endpoints

### 1. Upload Video

**Endpoint:** `POST /api/upload/video`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (FormData):**

```javascript
{
  file: <video_file>,      // Required
  lectureId: "<uuid>"      // Optional - nếu muốn lưu vào DB ngay
}
```

**Allowed formats:** MP4, MPEG, MOV, AVI

**Response:**

```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/course-videos/xxx.mp4",
    "path": "1234567890-uuid.mp4",
    "type": "video"
  }
}
```

---

### 2. Upload Document

**Endpoint:** `POST /api/upload/document`

**Body (FormData):**

```javascript
{
  file: <document_file>,   // Required
  lectureId: "<uuid>"      // Optional
}
```

**Allowed formats:** PDF, DOC, DOCX, PPT, PPTX, TXT

**Response:**

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/course-documents/xxx.pdf",
    "path": "1234567890-uuid.pdf",
    "type": "document"
  }
}
```

---

### 3. Upload Thumbnail

**Endpoint:** `POST /api/upload/thumbnail`

**Body (FormData):**

```javascript
{
  file: <image_file>,      // Required
  courseId: "<uuid>"       // Optional - tự động update vào Courses.ThumbUrl
}
```

**Allowed formats:** JPG, PNG, WEBP

**Response:**

```json
{
  "success": true,
  "message": "Thumbnail uploaded successfully",
  "data": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/course-thumbnails/xxx.jpg",
    "path": "1234567890-uuid.jpg",
    "type": "thumbnail"
  }
}
```

---

### 4. Get Lecture Materials

**Endpoint:** `GET /api/upload/lecture/:lectureId/materials`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "LectureId": "xxx-xxx-xxx",
      "Id": 1,
      "Type": "video",
      "Url": "https://xxx.supabase.co/storage/.../video.mp4"
    },
    {
      "LectureId": "xxx-xxx-xxx",
      "Id": 2,
      "Type": "document",
      "Url": "https://xxx.supabase.co/storage/.../document.pdf"
    }
  ]
}
```

---

### 5. Delete Material

**Endpoint:** `DELETE /api/upload/material/:lectureId/:materialId`

**Response:**

```json
{
  "success": true,
  "message": "Material deleted successfully"
}
```

---

## 💻 Sử Dụng Từ Frontend

### 1. Upload Video với React

```jsx
import { useState } from "react";
import axios from "axios";

function VideoUploadComponent({ lectureId }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["video/mp4", "video/mpeg", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only MP4, MPEG, MOV are allowed");
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      alert("File too large. Max 100MB");
      return;
    }

    try {
      setUploading(true);

      // Prepare FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lectureId", lectureId);

      // Upload to backend
      const response = await axios.post(
        "http://localhost:5000/api/upload/video",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setProgress(percentCompleted);
          },
        },
      );

      console.log("Upload successful:", response.data);
      alert(`Video uploaded: ${response.data.data.url}`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + error.response?.data?.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="video/mp4,video/mpeg,video/quicktime"
        onChange={handleVideoUpload}
        disabled={uploading}
      />

      {uploading && (
        <div>
          <p>Uploading... {progress}%</p>
          <progress value={progress} max="100" />
        </div>
      )}
    </div>
  );
}

export default VideoUploadComponent;
```

---

### 2. Upload Document

```jsx
function DocumentUploadComponent({ lectureId }) {
  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("lectureId", lectureId);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload/document",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Document uploaded:", response.data.data.url);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <input
      type="file"
      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
      onChange={handleDocumentUpload}
    />
  );
}
```

---

### 3. Upload Thumbnail

```jsx
function ThumbnailUploadComponent({ courseId }) {
  const [preview, setPreview] = useState(null);

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", courseId);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload/thumbnail",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      console.log("Thumbnail uploaded:", response.data.data.url);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleThumbnailUpload}
      />
      {preview && <img src={preview} alt="Preview" style={{ width: 200 }} />}
    </div>
  );
}
```

---

### 4. Get và Display Materials

```jsx
function LectureMaterialsList({ lectureId }) {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    fetchMaterials();
  }, [lectureId]);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/upload/lecture/${lectureId}/materials`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setMaterials(response.data.data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleDelete = async (materialId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/upload/material/${lectureId}/${materialId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      fetchMaterials(); // Refresh list
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div>
      <h3>Lecture Materials</h3>
      {materials.map((material) => (
        <div key={material.Id}>
          <span>{material.Type}: </span>
          <a href={material.Url} target="_blank" rel="noopener noreferrer">
            View
          </a>
          <button onClick={() => handleDelete(material.Id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing

### 1. Test Upload với Postman/Insomnia

**Upload Video:**

```
POST http://localhost:5000/api/upload/video
Headers:
  Authorization: Bearer <your_jwt_token>
  Content-Type: multipart/form-data

Body (form-data):
  file: <select video file>
  lectureId: <lecture_uuid>
```

**Upload Document:**

```
POST http://localhost:5000/api/upload/document
Headers:
  Authorization: Bearer <your_jwt_token>

Body (form-data):
  file: <select pdf/doc file>
  lectureId: <lecture_uuid>
```

**Get Materials:**

```
GET http://localhost:5000/api/upload/lecture/<lectureId>/materials
Headers:
  Authorization: Bearer <your_jwt_token>
```

---

### 2. Test với cURL

```bash
# Upload video
curl -X POST http://localhost:5000/api/upload/video \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/video.mp4" \
  -F "lectureId=lecture-uuid-here"

# Upload document
curl -X POST http://localhost:5000/api/upload/document \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "lectureId=lecture-uuid-here"

# Get materials
curl -X GET http://localhost:5000/api/upload/lecture/LECTURE_ID/materials \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔒 Security Notes

1. **Authentication Required**: Tất cả endpoints đều yêu cầu JWT token
2. **File Type Validation**: Server kiểm tra MIME type
3. **File Size Limit**: Max 500MB per file
4. **Public URLs**: Files trong buckets đều public (có thể access qua URL)
5. **Row Level Security**: Configure RLS trong Supabase Dashboard nếu cần

---

## 🚀 Production Checklist

- [ ] Đã chạy `npm run init-storage` để tạo buckets
- [ ] Environment variables đã được set đúng
- [ ] Đã test upload/download từ Frontend
- [ ] Đã configure CORS trong Supabase Dashboard
- [ ] Đã set storage limits phù hợp
- [ ] Đã backup database schema
- [ ] Đã test delete functionality

---

## 📊 Storage Quotas (Supabase Free Tier)

- **Storage**: 1 GB
- **Bandwidth**: 2 GB/month
- **Bucket limit**: Unlimited
- **File size limit**: Configurable (default 50MB, đã set 500MB)

Nếu vượt quota, cần upgrade plan hoặc optimize:

- Compress video trước khi upload
- Remove unused files
- Implement CDN caching

---

## 🐛 Troubleshooting

### Error: "Bucket does not exist"

```bash
# Chạy script để tạo buckets
npm run init-storage
```

### Error: "Invalid token"

- Check JWT token có đúng không
- Check token expiry
- Check Authorization header format: `Bearer <token>`

### Error: "File too large"

- Default limit: 500MB
- Check file size trước khi upload
- Compress video nếu cần

### Error: "CORS policy blocked"

- Check CORS settings trong Supabase Dashboard
- Add frontend URL vào allowed origins

---

## 📚 Related Documentation

- [Prisma Schema](backend/prisma/schema.prisma)
- [Supabase Config](backend/src/configs/supabase.js)
- [Storage Service](backend/src/services/storageService.js)
- [Upload Controller](backend/src/controllers/uploadController.js)
- [Upload Routes](backend/src/routers/upload.js)

---

## 🆘 Support

Nếu gặp vấn đề, kiểm tra:

1. Console logs trong browser (F12)
2. Backend terminal logs
3. Supabase Dashboard → Storage → Logs
4. Network tab để xem request/response details

---

**Last Updated:** February 26, 2026
