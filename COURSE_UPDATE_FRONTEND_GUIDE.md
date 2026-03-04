# Frontend Integration - Course Update

## Component: CourseUpdateForm

Địa chỉ: `frontend/src/components/CourseUpdateForm.jsx`

### Tính năng

- ✅ Cập nhật thông tin cơ bản của khóa học (tiêu đề, mô tả, giá, level)
- ✅ Tạo, cập nhật, xóa sections
- ✅ Tạo, cập nhật, xóa lectures
- ✅ Real-time form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Success notifications

## Cách sử dụng

### 1. Import Component

```javascript
import CourseUpdateForm from "../components/CourseUpdateForm";
```

### 2. Sử dụng trong Page

```javascript
import CourseUpdateForm from "../components/CourseUpdateForm";

export default function EditCoursePage() {
  const { courseId } = useParams();

  const handleSuccess = (updatedCourse) => {
    console.log("Course updated successfully:", updatedCourse);
    // Redirect hoặc reload data
  };

  return (
    <div className="edit-course-container">
      <CourseUpdateForm courseId={courseId} onSuccess={handleSuccess} />
    </div>
  );
}
```

### 3. Props

| Prop        | Type     | Required | Description                      |
| ----------- | -------- | -------- | -------------------------------- |
| `courseId`  | string   | Yes      | UUID của khóa học cần cập nhật   |
| `onSuccess` | function | No       | Callback khi cập nhật thành công |

## Ví dụ Page Integration

### EditCoursePage.jsx

```javascript
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import CourseUpdateForm from "../components/CourseUpdateForm";

export default function EditCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const handleSuccess = (updatedCourse) => {
    // Show success message
    alert("Khóa học đã được cập nhật thành công!");

    // Redirect to instructor dashboard
    navigate("/instructor/courses");
  };

  return (
    <div className="page-container">
      <CourseUpdateForm courseId={courseId} onSuccess={handleSuccess} />
    </div>
  );
}
```

## Intergration với Course Management Dashboard

Để thêm nút "Edit" trong danh sách khóa học của instructor:

```javascript
// InstructorCoursesPage.jsx
import { Link } from "react-router-dom";

export function InstructorCoursesPage() {
  const [courses, setCourses] = React.useState([]);

  return (
    <div className="courses-container">
      {courses.map((course) => (
        <div key={course.id} className="course-card">
          <h3>{course.title}</h3>
          <p>{course.shortDescription}</p>
          <div className="course-actions">
            <Link
              to={`/instructor/courses/${course.id}/edit`}
              className="btn btn-primary"
            >
              Chỉnh sửa
            </Link>
            <button className="btn btn-secondary">Xem Preview</button>
            {course.status === "Draft" && (
              <button className="btn btn-success">Xuất bản</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Route Configuration

Thêm route trong `App.jsx` hoặc router setup:

```javascript
import EditCoursePage from "./pages/EditCoursePage";

const routes = [
  {
    path: "/instructor/courses/:courseId/edit",
    element: <EditCoursePage />,
    requireAuth: true,
  },
];
```

## Form Behavior

### Khi Load Component

1. Fetch course data từ API
2. Điền dữ liệu vào form
3. Display all sections và lectures

### Khi User Thay Đổi

1. Real-time update trong formData state
2. Hiển thị preview của changes (tuỳ chọn)
3. Validate required fields

### Khi Submit

1. Hiển thị loading spinner
2. Gửi PUT request đến `/courses/:id/update`
3. Xử lý response:
   - **Success**: Hiển thị success message, gọi onSuccess callback
   - **Error**: Hiển thị error message, giữ form data

## Styling

Component sử dụng CSS-in-JS (styled with `<style jsx>`).

Để custom styling, có thể:

1. **Overwrite với CSS class**:

```css
.course-update-form .form-control {
  /* Your custom styles */
}
```

2. **Wrapper className**:

```javascript
<div className="my-custom-wrapper">
  <CourseUpdateForm courseId={courseId} />
</div>
```

3. **Create custom variant**:

```javascript
// Custom component
const CustomCourseForm = (props) => {
  return (
    <div className="custom-style">
      <CourseUpdateForm {...props} />
    </div>
  );
};
```

## Responsive Design

Form được design cho:

- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (< 768px)

## API Integration

Component sử dụng:

- `GET /courses/instructor/course/:id` - Fetch course details
- `PUT /courses/:id/update` - Update course

### Authentication

Yêu cầu JWT token trong `localStorage.token` hoặc từ auth context.

## Error Handling

Các lỗi được handle:

- Network errors
- Validation errors từ server
- Permission errors (403)
- Not found (404)
- Server errors (500)

## Accessibility

Component bao gồm:

- ✅ Semantic HTML
- ✅ Labels cho tất cả inputs
- ✅ Error messages
- ✅ Form validation feedback
- ✅ Keyboard navigation support

## Troubleshooting

### Form không load dữ liệu

```
✓ Kiểm tra courseId đúng
✓ Kiểm tra JWT token hợp lệ
✓ Check console cho error messages
```

### Update không thành công

```
✓ Kiểm tra user là instructor của course
✓ Kiểm tra dữ liệu hợp lệ (price > 0, title not empty)
✓ Kiểm tra network requests trong DevTools
```

### Section/Lecture không xóa

```
✓ Refresh page để kiểm tra dữ liệu mới nhất
✓ Check browser console cho errors
✓ Xác nhận permission của instructor
```

## Performance Tips

1. **Debounce form changes** (nếu cần real-time preview)
2. **Lazy load** large forms
3. **Memoize component** nếu trong list
4. **Cache course data** khi appropriate

## Xem thêm

- [INSTRUCTOR_UPDATE_COURSE_GUIDE.md](INSTRUCTOR_UPDATE_COURSE_GUIDE.md) - API documentation
- [INSTRUCTOR_UPLOAD_GUIDE.md](INSTRUCTOR_UPLOAD_GUIDE.md) - General instructor features
