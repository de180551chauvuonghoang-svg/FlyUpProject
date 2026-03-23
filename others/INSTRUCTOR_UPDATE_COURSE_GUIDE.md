# Instructor Course Update Guide

## Giới thiệu

Instructor giờ đây có thể cập nhật các khóa học cũ của họ, bao gồm:

- Thông tin cơ bản: tiêu đề, mô tả, giá, level
- Sections và Lectures: tạo mới, cập nhật, hoặc xóa

## API Endpoint

### Update Course

**Endpoint:** `PUT /courses/:id/update`

**Authentication:** Required (JWT Token)

**Headers:**

```javascript
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**URL Parameters:**

- `id` - Course ID (UUID)

### Request Body

```javascript
{
  "title": "Updated Course Title",              // Optional
  "intro": "Cập nhật mô tả ngắn",               // Optional
  "description": "Mô tả dài của khóa học",      // Optional
  "price": 99.99,                               // Optional (number)
  "level": "Intermediate",                      // Optional: Beginner, Intermediate, Advanced
  "sections": [
    {
      "id": "existing-section-id",              // For updating existing section
      // OR omit "id" to create new section
      "title": "Section 1",
      "lectures": [
        {
          "id": "existing-lecture-id",          // For updating existing lecture
          // OR omit "id" to create new lecture
          "title": "Lecture 1",
          "description": "Lecture content"
        },
        {
          "title": "New Lecture 2",
          "description": "Another lecture content"
        }
      ]
    },
    {
      "title": "New Section 2",
      "lectures": [
        {
          "title": "Lecture in new section",
          "description": "Content here"
        }
      ]
    }
  ]
}
```

### Response Success (200)

```javascript
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "Id": "course-uuid",
    "Title": "Updated Course Title",
    "Intro": "Cập nhật mô tả ngắn",
    "Description": "Mô tả dài của khóa học",
    "Price": 99.99,
    "Level": "Intermediate",
    "Status": "Draft",
    "Sections": [
      {
        "Id": "section-uuid",
        "Title": "Section 1",
        "Index": 0,
        "Lectures": [
          {
            "Id": "lecture-uuid",
            "Title": "Lecture 1"
          }
        ]
      }
    ]
  }
}
```

### Response Errors

**400 - Bad Request:**

```javascript
{
  "success": false,
  "error": "At least one field must be provided to update"
}
```

**403 - Forbidden:**

```javascript
{
  "success": false,
  "error": "You are not an instructor"
  // or
  "error": "Course not found or you don't have permission to update it"
}
```

**500 - Server Error:**

```javascript
{
  "success": false,
  "error": "Error message"
}
```

## Ví dụ Sử Dụng

### 1. Cập nhật thông tin cơ bản

```bash
curl -X PUT http://localhost:3000/api/courses/123e4567-e89b-12d3-a456-426614174000/update \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Java Programming 2024",
    "description": "Learn Java from beginner to advanced",
    "price": 149.99,
    "level": "Intermediate"
  }'
```

### 2. Cập nhật Sections và Lectures

```bash
curl -X PUT http://localhost:3000/api/courses/123e4567-e89b-12d3-a456-426614174000/update \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "sections": [
      {
        "id": "existing-section-id-123",
        "title": "Updated Section 1",
        "lectures": [
          {
            "id": "existing-lecture-id-456",
            "title": "Updated Lecture Title",
            "description": "Updated content"
          },
          {
            "title": "New Lecture (will be created)",
            "description": "New lecture content"
          }
        ]
      },
      {
        "title": "Brand New Section",
        "lectures": [
          {
            "title": "First lecture in new section",
            "description": "Content"
          }
        ]
      }
    ]
  }'
```

### 3. Sử dụng JavaScript/Fetch

```javascript
const updateCourse = async (courseId, updates) => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/courses/${courseId}/update`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (result.success) {
      console.log("Course updated:", result.data);
    } else {
      console.error("Update failed:", result.error);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Sử dụng
await updateCourse("course-id-123", {
  title: "Updated Title",
  price: 99.99,
  sections: [
    {
      id: "section-123",
      title: "Updated Section",
      lectures: [
        {
          id: "lecture-456",
          title: "Updated Lecture",
        },
      ],
    },
  ],
});
```

## Quy tắc Cập nhật

### Sections

- **Cập nhật**: Gửi section với `id` đã tồn tại
- **Tạo mới**: Gửi section MỖI CÓ `id`
- **Xóa**: Không đưa section vào danh sách updates - section cũ sẽ bị xóa

### Lectures

- **Cập nhật**: Gửi lecture với `id` đã tồn tại trong section
- **Tạo mới**: Gửi lecture MỖI CÓ `id` trong section
- **Xóa**: Không đưa lecture vào danh sách - lecture cũ sẽ bị xóa

## Lưu ý quan trọng

1. **Chỉ instructor sở hữu khóa học mới có thể cập nhật** - Được xác thực qua JWT token
2. **Draft courses có thể cập nhật bất cứ lúc nào** - Kể cả sau khi xuất bản
3. **Để cập nhật giảm giá hoặc other fields**, sử dụng endpoint khác nếu cần
4. **CreationTime không thể cập nhật** - Nó được giữ nguyên từ khi tạo
5. **LastModificationTime được tự động cập nhật** - Mỗi khi có thay đổi

## Kế tiếp

Für để dùng chức năng này trong frontend React:

1. Tạo form component để instructor update course
2. Gọi API endpoint này khi submit form
3. Hiển thị loading/success/error states
4. Reload course data sau khi update thành công

Xem [INSTRUCTOR_UPLOAD_GUIDE.md](INSTRUCTOR_UPLOAD_GUIDE.md) để biết thêm về instructor features.
