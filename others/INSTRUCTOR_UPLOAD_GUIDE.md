# FlyUp EduTech - Instructor Upload Guide

## 🎓 Trang Tạo Khoá Học Cho Instructor

### 📍 Truy cập trang upload

```
http://localhost:5173/instructor/create-course
```

### ✨ Các tính năng chính

#### 1. **Course Details**

- **Course Title** (Bắt buộc): Tên khoá học
- **Course Description**: Mô tả chi tiết khoá học
- **Price (VND)**: Giá khoá học
- **Course Level**: Mức độ (Beginner/Intermediate/Advanced/Expert)

#### 2. **Course Content**

- **Add Section**: Thêm các phần (Section)
- **Upload Lectures**: Upload video bài giảng cho mỗi section
- **Manage Content**: Xóa sections hoặc lectures

#### 3. **Preview & Action**

- **Course Preview**: Xem trước thông tin khoá học
- **Course Stats**: Hiển thị số section, lectures, giá, level
- **Create Course**: Nút tạo khoá học

---

## 🚀 Workflow - Tạo Khoá Học

### Step 1: Điền Thông Tin Cơ Bản

1. Nhập "Course Title" (ví dụ: "Java Mastery 2024")
2. Điền "Course Description"
3. Nhập "Price"
4. Chọn "Course Level"

### Step 2: Tạo Sections & Upload Lectures

1. Nhập tên section trong input "Section Title"
   - Ví dụ: "Section 1: Java Fundamentals"
2. Nhấn nút "Add Section"
3. **Ngay sau khi section được tạo, upload video cho section đó:**
   - Nhấp vào section để mở rộng
   - Nhấn vào "Upload Lecture Video"
   - Chọn file video từ máy tính
   - Video sẽ hiển thị trong danh sách lectures
4. Lặp lại quy trình (thêm section & upload video) cho tất cả sections

### Step 3: Tạo Khoá Học

1. Kiểm tra thông tin trong "Course Preview"
2. Nhấn nút "Create Course"
3. Chờ khoá học được tạo thành công

---

## 📋 Validation Rules

✅ **Course Title** - Bắt buộc, không được để trống
✅ **At least 1 Section** - Phải có ít nhất 1 section
✅ **At least 1 Lecture** - Phải có ít nhất 1 video/lecture

---

## 📊 Current UI Components

### Card Layout

- **Course Details Card**: Gradient background, organized form inputs
- **Course Content Card**: Section management with expandable list
- **Preview Card**: Sticky preview showing course overview
- **Stats Display**: Section, lecture, price, level info

### Visual Elements

- 🎨 **Gradient backgrounds**: Purple to blue gradients
- 📱 **Responsive design**: Works on all screen sizes
- 🎯 **Icons**: Material Symbols for better UX
- ✨ **Hover effects**: Interactive feedback

---

## 🔧 Next Steps - Backend Integration

### 1. Create Course API

```javascript
POST /api/courses/create
Body: {
  title: string,
  description: string,
  price: number,
  level: string,
  creatorId: string
}
```

### 2. Create Section API

```javascript
POST /api/courses/:courseId/sections
Body: {
  title: string,
  index: number
}
```

### 3. Upload Lecture API

```javascript
POST /api/sections/:sectionId/lectures
Body: FormData {
  title: string,
  videoFile: File,
  content: string
}
```

### 4. Publish Course API

```javascript
PUT /api/courses/:courseId/publish
```

---

## 🎨 UI Preview

```
┌─────────────────────────────────────────────────┐
│   Create a New Course                           │
│   Build an engaging learning experience         │
└─────────────────────────────────────────────────┘

┌─────────────────────────┬──────────────────────┐
│  COURSE DETAILS         │   PREVIEW CARD       │
│  • Title input          │   • Thumbnail        │
│  • Description          │   • Title preview    │
│  • Price & Level        │   • Stats (4/12)     │
│                         │   • Price display    │
├─────────────────────────┤   • [Create Course]  │
│  COURSE CONTENT         │   • [Cancel]         │
│  (Step 2: Tạo & Upload) │   • Info box         │
│  • Add Section input    │                      │
│    [Add] [Upload Video] │                      │
│  • Section 1            │                      │
│    ├─ Lecture 1         │                      │
│    ├─ Lecture 2         │                      │
│    ├─ [+ Add Lecture]   │                      │
│    └─ [Upload More]     │                      │
│  • Section 2            │                      │
│    ├─ Lecture 3         │                      │
│    └─ [Upload More]     │                      │
└─────────────────────────┴──────────────────────┘
```

---

## 💡 Tips & Best Practices

1. **Course Title**: Make it clear and descriptive
2. **Price**: Check competitor pricing
3. **Sections**: Organize content logically
4. **Videos**: Keep under 20 minutes per lecture
5. **Description**: Highlight learning outcomes

---

## 📝 Notes

- UI is fully designed and responsive
- Backend integration needed for:
  - Creating courses
  - Uploading video files
  - Storing section/lecture data
- Consider adding:
  - Course thumbnail upload
  - Course preview video
  - Student reviews/ratings
  - Course analytics dashboard

---

**Status**: ✅ Frontend UI Complete | ⏳ Backend Integration Pending
