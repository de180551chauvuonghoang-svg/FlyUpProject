# 📢 Course Publishing Guide - FlyUp

Hướng dẫn publish khóa học để learner có thể mua trên trang Courses.

---

## 🔄 Luồng Publish Course

```
Tạo Course → Status: "Draft", ApprovalStatus: "Pending"
         ↓
    Nhấn "Pub" → Status: "Ongoing", ApprovalStatus: "Approved"
         ↓
    Hiển thị trên trang /courses (công khai cho learner)
```

---

## ✅ Điều kiện để course hiển thị công khai

Course sẽ chỉ xuất hiện trên trang `/courses` nếu:

- ✅ `Status` = **"Ongoing"**
- ✅ `ApprovalStatus` = **"Approved"** hoặc **"APPROVED"**

---

## 🎬 API Endpoints

### 1. Publish Course

```
PUT /api/courses/:courseId/publish
Headers: Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Course published successfully and is now visible to students",
  "data": { ... }
}
```

---

### 2. Unpublish Course

```
PUT /api/courses/:courseId/unpublish
Headers: Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Course unpublished and hidden from students",
  "data": { ... }
}
```

---

## 💻 Frontend Usage

### Instructor Dashboard

Button "Pub" đã được tích hợp:

```jsx
const handlePublish = async (courseId) => {
  const token = localStorage.getItem("accessToken");
  const course = courses.find((c) => c.id === courseId);
  const isPublished = course?.status === "Ongoing";

  const endpoint = isPublished ? "unpublish" : "publish";
  const response = await fetch(`${API_URL}/courses/${courseId}/${endpoint}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Update UI
  toast.success("Course published!");
};
```

---

## 📊 Status & ApprovalStatus

### Status Values:

- **Draft** - Đang soạn thảo, chưa public
- **Ongoing** - Đã publish, hiển thị cho learner
- **Archived** - Đã lưu trữ, không hiển thị

### ApprovalStatus Values:

- **Pending** - Chờ duyệt
- **Approved** / **APPROVED** - Đã duyệt, cho phép public
- **Rejected** - Bị từ chối

---

## 🧪 Testing

### 1. Tạo course mới

```bash
POST /api/courses/create
{
  "title": "Test Course",
  "description": "Test description",
  "price": 99.99,
  "level": "Beginner",
  "sections": [...]
}
```

**Initial state:**

- Status: "Draft"
- ApprovalStatus: "Pending"
- **NOT visible** trên /courses

---

### 2. Publish course

```bash
PUT /api/courses/<course-id>/publish
```

**After publish:**

- Status: "Ongoing"
- ApprovalStatus: "Approved"
- **NOW visible** trên /courses ✅

---

### 3. Verify trên trang public

```
GET /api/courses
```

Course của bạn sẽ xuất hiện trong list!

---

## 🔍 Troubleshooting

### Course không hiển thị sau khi publish?

**Check 1: Status & ApprovalStatus**

```sql
SELECT "Id", "Title", "Status", "ApprovalStatus"
FROM "Courses"
WHERE "Id" = '<your-course-id>';
```

Expected:

- Status = "Ongoing"
- ApprovalStatus = "Approved" hoặc "APPROVED"

---

**Check 2: Console Logs**

Backend terminal:

```
[courseService] Publishing course: xxx-xxx by instructor: yyy-yyy
[courseService] Course published successfully: xxx-xxx
```

Browser console:

```
Publish successful
Course status updated to: Ongoing
```

---

**Check 3: API Response**

```bash
# Check if course appears in public list
curl http://localhost:5000/api/courses
```

---

## 📝 Notes

1. **Auto-approve:** Hiện tại course tự động approve khi publish (không cần admin duyệt)
2. **Permission check:** Chỉ instructor sở hữu course mới có thể publish
3. **Toggle:** Có thể unpublish để đưa course về Draft

---

## 🔐 Security

- ✅ JWT Authentication required
- ✅ Ownership verification (instructor must own the course)
- ✅ Permission check before publish/unpublish

---

## 🚀 Quick Test Flow

1. **Login as instructor**
2. **Create a new course** (status = Draft)
3. **Go to Instructor Dashboard**
4. **Click "Pub" button**
5. **Check trang `/courses`** → Course xuất hiện! ✅

---

**Last Updated:** February 26, 2026
