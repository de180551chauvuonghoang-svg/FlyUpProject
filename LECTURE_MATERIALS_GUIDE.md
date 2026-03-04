# Hướng Dẫn Thêm Lecture Materials

## ✅ Đã Hoàn Thành

Hệ thống đã được cập nhật để hiển thị tài liệu học tập (Lecture Materials) từ database lên trang học.

### Các thay đổi đã thực hiện:

1. **Backend API**: Đã sẵn sàng - API `getCourseById` đã bao gồm `LectureMaterial`
2. **Frontend**:
   - Hiển thị video từ LectureMaterial
   - Tab "Resources" hiển thị TẤT CẢ materials (videos, PDFs, documents)
   - Icon và màu sắc phù hợp cho từng loại file
   - Nút View và Download cho mỗi material

## 📝 Cấu Trúc Dữ Liệu

### Bảng `LectureMaterial` trong Database:

```sql
CREATE TABLE "LectureMaterial" (
  "LectureId" UUID NOT NULL,
  "Id" INTEGER NOT NULL,
  "Type" VARCHAR(50),
  "Url" VARCHAR(255),
  PRIMARY KEY ("LectureId", "Id")
);
```

### Các loại Type được hỗ trợ:

- `video` - Video files (MP4, etc.)
- `pdf` - PDF documents
- `docx` / `doc` - Word documents
- `pptx` / `ppt` - PowerPoint presentations
- `xlsx` / `xls` - Excel spreadsheets
- `zip` - Compressed archives
- `txt` - Text files

## 🔧 Cách Thêm Materials Vào Database

### Cách 1: Trực tiếp trong Supabase

1. Mở Supabase Dashboard
2. Vào bảng `LectureMaterial`
3. Click "Insert" → "Insert row"
4. Nhập dữ liệu:
   - **LectureId**: UUID của lecture (lấy từ bảng `Lectures`)
   - **Type**: Loại file (video, pdf, docx, etc.)
   - **Url**: URL đến file (Supabase Storage hoặc external URL)

### Cách 2: SQL Script

```sql
-- Thêm video cho lecture
INSERT INTO "LectureMaterial" ("LectureId", "Type", "Url")
VALUES
  ('00et965c-574e-487b-ab36-55619d89ef37', 'video', 'https://commondatastorage.googleapis.com/...'),
  ('00et965c-574e-487b-ab36-55619d89ef37', 'pdf', 'https://wmiyvccxnlsylyweuiihf.supabase.co/.../lecture.pdf'),
  ('00et965c-574e-487b-ab36-55619d89ef37', 'docx', 'https://wmiyvccxnlsylyweuiihf.supabase.co/.../notes.docx');
```

### Cách 3: Script Node.js

Tạo file `backend/scripts/add-lecture-materials.js`:

```javascript
import prisma from "../src/lib/prisma.js";

async function addLectureMaterials() {
  try {
    // Lấy lecture ID từ khóa Java Course
    const javaLectures = await prisma.lectures.findMany({
      where: {
        Sections: {
          Courses: {
            Title: {
              contains: "Java",
              mode: "insensitive",
            },
          },
        },
      },
      take: 3,
    });

    console.log("Found lectures:", javaLectures.length);

    for (const lecture of javaLectures) {
      // Thêm video material
      await prisma.lectureMaterial.create({
        data: {
          LectureId: lecture.Id,
          Type: "video",
          Url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        },
      });

      // Thêm PDF material
      await prisma.lectureMaterial.create({
        data: {
          LectureId: lecture.Id,
          Type: "pdf",
          Url: "https://wmiyvccxnlsylyweuiihf.supabase.co/storage/v1/object/public/course-materials/sample.pdf",
        },
      });

      console.log(`✅ Added materials for lecture: ${lecture.Title}`);
    }

    console.log("✅ Done!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addLectureMaterials();
```

Chạy script:

```bash
cd backend
node scripts/add-lecture-materials.js
```

## 🎯 Test Trên Giao Diện

### Bước 1: Thêm Materials cho Java Course

Sử dụng một trong các cách trên để thêm materials vào các lecture của khóa Java.

### Bước 2: Truy cập trang học

1. Đăng nhập với tài khoản student đã enroll khóa Java
2. Vào "My Learning"
3. Click vào khóa Java Course
4. Chọn một lesson

### Bước 3: Kiểm tra hiển thị

- **Video**: Hiển thị ở video player chính
- **Tab Resources**: Click để xem tất cả materials
- **Mỗi material** có:
  - Icon phù hợp với loại file
  - Tên loại file
  - Tên file
  - Nút "View" (mở trong tab mới)
  - Nút "Download"

## 📊 Ví Dụ Upload File Lên Supabase Storage

### 1. Upload qua Supabase Dashboard

1. Vào Supabase → Storage → course-materials bucket
2. Upload file
3. Copy public URL
4. Paste URL vào bảng LectureMaterial

### 2. Upload qua Code

```javascript
import { supabase } from "../src/configs/supabase.js";

async function uploadMaterial(lectureId, filePath, fileType) {
  // Upload file
  const fileName = `lecture_${lectureId}_${Date.now()}.${fileType}`;
  const { data, error } = await supabase.storage
    .from("course-materials")
    .upload(fileName, filePath);

  if (error) throw error;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("course-materials").getPublicUrl(fileName);

  // Save to database
  await prisma.lectureMaterial.create({
    data: {
      LectureId: lectureId,
      Type: fileType,
      Url: publicUrl,
    },
  });

  return publicUrl;
}
```

## 🐛 Troubleshooting

### Materials không hiển thị?

1. **Kiểm tra database**:

   ```sql
   SELECT * FROM "LectureMaterial" WHERE "LectureId" = 'your-lecture-id';
   ```

2. **Kiểm tra browser console**: Xem có lỗi fetch data không

3. **Kiểm tra API response**:
   - Mở Network tab trong DevTools
   - Tìm request `/api/courses/{courseId}`
   - Xem response có chứa `LectureMaterial` array không

### URL không hoạt động?

- Đảm bảo file trong Supabase Storage có quyền public
- Kiểm tra CORS settings cho external URLs
- Test URL trực tiếp trong browser

## 📚 Tài Liệu Liên Quan

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- Backend Service: `backend/src/services/courseService.js`
- Frontend Component: `frontend/src/pages/CourseLessonPage.jsx`
