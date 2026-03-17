# 👁️ Course Preview Feature - Instructor Guide

Hướng dẫn xem preview khóa học trước khi publish cho learners.

---

## 🎯 Tính năng mới

Instructor có thể **preview khóa học** (kể cả Draft) để kiểm tra:

- ✅ Video lectures đã upload đúng chưa
- ✅ Tài liệu documents có hiển thị không
- ✅ Cấu trúc sections/lectures
- ✅ UI giống hệt learner sẽ thấy

---

## 🚀 Cách sử dụng

### 1. Từ Instructor Dashboard

1. **Mở Instructor Dashboard**: `/instructor-dashboard`
2. **Tìm khóa học** cần preview
3. **Click nút "View"** (icon visibility 👁️)
4. → Trang lesson preview sẽ mở với UI của learner

### 2. Các trạng thái khóa học

**DRAFT** (Draft):

- ✅ Instructor có thể preview
- ❌ Learner KHÔNG thể thấy
- 💡 Dùng để kiểm tra nội dung

**ONGOING** (Published):

- ✅ Instructor có thể preview
- ✅ Learner có thể thấy và mua
- 🎉 Khóa học đã public

---

## 📋 UI Preview

### Sidebar Course Structure

```
📚 Course Title
├── 📂 Section 1: Introduction
│   ├── 📹 1.1 Welcome
│   ├── 📹 1.2 Setup
│   └── 📄 1.3 Resources
├── 📂 Section 2: Deep Dive
│   ├── 📹 2.1 Core Concepts
│   └── 📹 2.2 Practice
```

### Content Area

- **Overview Tab**: Thông tin về lesson
- **Resources Tab**: Tài liệu download
- **Q&A Tab**: Hỏi đáp (nếu có)
- **Notes Tab**: Ghi chú cá nhân

---

## 🔧 API Endpoints

### Get Instructor Course (allows Draft)

```
GET /api/courses/instructor/course/:courseId
Headers: Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "Id": "xxx-xxx",
    "Title": "Course Name",
    "Status": "Draft",
    "ApprovalStatus": "Pending",
    "Sections": [
      {
        "Id": "section-1",
        "Title": "Section 1",
        "Index": 0,
        "Lectures": [
          {
            "Id": "lecture-1",
            "Title": "Lecture 1"
          }
        ]
      }
    ]
  }
}
```

---

## 🎨 Frontend Implementation

### Route Structure

```javascript
// Allow instructor to view course without lessonId
<Route path="/course/:courseId" element={<CourseLessonPage />} />

// Specific lesson
<Route path="/course/:courseId/lesson/:lessonId" element={<CourseLessonPage />} />
```

### Instructor Preview Detection

```javascript
const isInstructorPreview =
  (user?.instructor || user?.instructorId || user?.role === "instructor") &&
  !lessonId; // Viewing course root, not specific lesson
```

### API Call Logic

```javascript
const endpoint = isInstructorPreview
  ? `/courses/instructor/course/${courseId}` // Can see Draft
  : `/courses/${courseId}`; // Only Ongoing
```

---

## 🔐 Security

### Permission Checks

1. **Instructor Verification**: User must be instructor
2. **Ownership Check**: Course must belong to instructor
3. **JWT Authentication**: Required for preview

### Draft Course Access

- ✅ **Owner instructor**: Can preview
- ❌ **Other instructors**: Cannot view
- ❌ **Learners**: Cannot see at all

---

## 📊 Workflow

```
Tạo Course (Draft)
    ↓
Upload Videos/Documents
    ↓
Click "View" button 👁️
    ↓
Preview UI (as Learner)
    ↓
Kiểm tra nội dung ✅
    ↓
Click "Pub" to publish
    ↓
Course visible to Learners 🎉
```

---

## 🧪 Testing Steps

### 1. Create Draft Course

```bash
POST /api/courses/create
{
  "title": "Test Course",
  "sections": [...]
}
```

Result: Status = "Draft"

### 2. Preview as Instructor

- Go to Instructor Dashboard
- Click "View" button
- **Should see**: Course with all sections/lectures
- **URL**: `/course/<courseId>`

### 3. Try as Non-Owner

- Logout
- Login as different instructor
- Try to access: `/course/<courseId>`
- **Should get**: 403 Permission denied

### 4. Publish and Test

- Click "Pub" button
- Check coursespage
- **Should see**: Course now visible

---

## 🐛 Troubleshooting

### Course not loading in preview?

**Check:**

1. Are you logged in as instructor?
2. Do you own this course?
3. Is token valid? `localStorage.getItem('accessToken')`

**Console logs:**

```javascript
[lessonService] Fetching course lessons for: xxx isInstructorPreview: true
[courseService] Fetching instructor course: xxx for instructor: yyy
```

---

### Getting "Course not found"?

**Possible reasons:**

1. Course ID incorrect
2. You're not the owner
3. Backend endpoint not deployed

**Fix:**

- Check Network tab in DevTools
- Look for `/courses/instructor/course/:id` request
- Check response error message

---

### Preview shows "Ongoing" but course is Draft?

**This means:**

- You published the course already
- Status in DB is "Ongoing", not "Draft"

**To revert:**

- Click "Unpub" button
- Course will return to Draft status

---

## 📝 Button Changes

### Before (Old)

```
[Edit] [Pub] [🗑️]
```

- Edit: Opens course editor
- Pub: Publishes course

### After (New)

```
[View] [Pub] [🗑️]
```

- **View**: Preview course as learner 👁️
- Pub: Publishes course
- 🗑️: Deletes course

---

## 💡 Best Practices

### Before Publishing:

1. ✅ Create all sections
2. ✅ Upload all lectures
3. ✅ Add thumbnails
4. ✅ **Preview with "View" button**
5. ✅ Check video playback
6. ✅ Test document downloads
7. ✅ Verify navigation works
8. ✅ Then click "Pub"

### After Publishing:

- Course appears on `/courses` page
- Learners can enroll
- You can still preview anytime

---

## 🎬 Video Uploads

When previewing, check:

- ☑️ Video URL loads correctly
- ☑️ Playback controls work
- ☑️ Video quality is good
- ☑️ Subtitles display (if any)

---

## 📄 Document Uploads

When previewing, check:

- ☑️ Document links work
- ☑️ Download button functional
- ☑️ File size displayed
- ☑️ Preview available (PDF)

---

## 🔄 Updates Flow

1. **Create Draft Course**
2. **Upload content**
3. **Preview** → Find issues
4. **Fix/Update content**
5. **Preview again** → Verify
6. **Publish** → Live!

---

**Last Updated:** February 26, 2026
**Feature:** Instructor Course Preview
**Status:** ✅ Live
