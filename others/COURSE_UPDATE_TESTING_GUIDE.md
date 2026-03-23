# Course Update API - Testing Guide

## Postman Collection Examples

### 1. Get Course Details (Before Update)

**Method:** GET  
**URL:** `{{baseUrl}}/courses/instructor/course/{{courseId}}`  
**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "Id": "550e8400-e29b-41d4-a716-446655440000",
    "Title": "Java Programming Basics",
    "Intro": "Learn Java from scratch",
    "Description": "Complete Java course for beginners",
    "Price": 99.99,
    "Level": "Beginner",
    "Status": "Draft",
    "Sections": [
      {
        "Id": "660e8400-e29b-41d4-a716-446655440001",
        "Title": "Section 1: Intro",
        "Index": 0,
        "Lectures": [
          {
            "Id": "770e8400-e29b-41d4-a716-446655440002",
            "Title": "What is Java"
          },
          {
            "Id": "770e8400-e29b-41d4-a716-446655440003",
            "Title": "Setting up Environment"
          }
        ]
      }
    ]
  }
}
```

---

### 2. Update Basic Course Info Only

**Method:** PUT  
**URL:** `{{baseUrl}}/courses/{{courseId}}/update`  
**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "title": "Advanced Java Programming 2024",
  "price": 149.99,
  "level": "Intermediate"
}
```

**Expected Response:** 200 OK

```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "Id": "550e8400-e29b-41d4-a716-446655440000",
    "Title": "Advanced Java Programming 2024",
    "Price": 149.99,
    "Level": "Intermediate",
    "Sections": [...]
  }
}
```

---

### 3. Add New Section and Lectures

**Method:** PUT  
**URL:** `{{baseUrl}}/courses/{{courseId}}/update`  
**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "sections": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Section 1: Intro",
      "lectures": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "title": "What is Java"
        },
        {
          "id": "770e8400-e29b-41d4-a716-446655440003",
          "title": "Setting up Environment"
        }
      ]
    },
    {
      "title": "Section 2: Advanced Concepts",
      "lectures": [
        {
          "title": "OOP Principles",
          "description": "Learn Object-Oriented Programming"
        },
        {
          "title": "Design Patterns",
          "description": "Common design patterns in Java"
        }
      ]
    }
  ]
}
```

---

### 4. Update Existing Lecture

**Method:** PUT  
**URL:** `{{baseUrl}}/courses/{{courseId}}/update`  
**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "sections": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Section 1: Intro",
      "lectures": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "title": "What is Java - Updated",
          "description": "Updated description about Java"
        }
      ]
    }
  ]
}
```

---

### 5. Delete Lecture (Remove from array)

**Method:** PUT  
**URL:** `{{baseUrl}}/courses/{{courseId}}/update`  
**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "sections": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Section 1: Intro",
      "lectures": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "title": "What is Java"
        }
      ]
    }
  ]
}
```

**Note:** Lecture với ID `770e8400-e29b-41d4-a716-446655440003` sẽ bị xóa vì nó không có trong danh sách.

---

### 6. Delete Entire Section

**Method:** PUT  
**URL:** `{{baseUrl}}/courses/{{courseId}}/update`  
**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "sections": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Section 1: Intro",
      "lectures": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "title": "What is Java"
        }
      ]
    }
  ]
}
```

**Note:** Bất kỳ section nào không có trong request sẽ bị xóa.

---

### 7. Complete Course Update

**Method:** PUT  
**URL:** `{{baseUrl}}/courses/{{courseId}}/update`  
**Headers:**

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**

```json
{
  "title": "Complete Java Masterclass 2024",
  "intro": "Master Java programming from basics to advanced",
  "description": "This comprehensive Java course covers everything from setup to design patterns",
  "price": 199.99,
  "level": "Advanced",
  "sections": [
    {
      "title": "Section 1: Fundamentals",
      "lectures": [
        {
          "title": "Introduction to Java",
          "description": "History and features of Java"
        },
        {
          "title": "Environment Setup",
          "description": "Installing JDK and setting up IDE"
        },
        {
          "title": "First Program",
          "description": "Writing and running your first Java program"
        }
      ]
    },
    {
      "title": "Section 2: Object-Oriented Programming",
      "lectures": [
        {
          "title": "Classes and Objects",
          "description": "Understanding OOP concepts"
        },
        {
          "title": "Inheritance",
          "description": "Code reuse through inheritance"
        },
        {
          "title": "Polymorphism",
          "description": "Method overloading and overriding"
        }
      ]
    },
    {
      "title": "Section 3: Advanced Topics",
      "lectures": [
        {
          "title": "Collections Framework",
          "description": "Lists, Sets, Maps and more"
        },
        {
          "title": "Stream API",
          "description": "Functional programming in Java"
        },
        {
          "title": "Exception Handling",
          "description": "Try-catch, custom exceptions"
        }
      ]
    }
  ]
}
```

---

## JavaScript/Node.js Testing

### Using Fetch API

```javascript
// Helper function to update course
async function updateCourse(courseId, updates, token) {
  const response = await fetch(
    `http://localhost:3000/api/courses/${courseId}/update`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Update failed");
  }

  return result;
}

// Test Case 1: Update basic info
async function testUpdateBasicInfo(courseId, token) {
  console.log("Test 1: Update basic course info...");

  const result = await updateCourse(
    courseId,
    {
      title: "Updated Java Course",
      price: 149.99,
      level: "Intermediate",
    },
    token,
  );

  console.log("✓ Success:", result.data.Title, result.data.Price);
}

// Test Case 2: Add new section
async function testAddSection(courseId, token) {
  console.log("Test 2: Add new section...");

  const result = await updateCourse(
    courseId,
    {
      sections: [
        {
          title: "New Section",
          lectures: [{ title: "Lecture 1", description: "Content" }],
        },
      ],
    },
    token,
  );

  console.log(
    "✓ Success: Added section with",
    result.data.Sections.length,
    "sections",
  );
}

// Test Case 3: Update lecture
async function testUpdateLecture(courseId, lectureId, sectionId, token) {
  console.log("Test 3: Update existing lecture...");

  const result = await updateCourse(
    courseId,
    {
      sections: [
        {
          id: sectionId,
          title: "Section Title",
          lectures: [
            {
              id: lectureId,
              title: "Updated Lecture Title",
              description: "Updated content",
            },
          ],
        },
      ],
    },
    token,
  );

  console.log("✓ Success: Lecture updated");
}

// Run all tests
async function runTests() {
  const token = "your_jwt_token_here";
  const courseId = "your_course_id_here";

  try {
    await testUpdateBasicInfo(courseId, token);
    await testAddSection(courseId, token);
    // Add more tests as needed
    console.log("All tests passed! ✓");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Execute tests
runTests();
```

### Using Axios

```javascript
import axios from "axios";

const courseAPI = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Update course
async function updateCourseAxios(courseId, data) {
  try {
    const response = await courseAPI.put(`/courses/${courseId}/update`, data);
    console.log("Update successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Update failed:", error.response?.data?.error);
    throw error;
  }
}

// Usage
await updateCourseAxios("course-id-123", {
  title: "Updated Title",
  price: 99.99,
  sections: [
    {
      title: "Section 1",
      lectures: [{ title: "Lecture 1" }],
    },
  ],
});
```

---

## Error Test Cases

### 1. Missing JWT Token

**Expected Response:** 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 2. Invalid Course ID

**Expected Response:** 404 Not Found

```json
{
  "success": false,
  "error": "Course not found or you don't have permission to update it"
}
```

### 3. User is Not Instructor

**Expected Response:** 403 Forbidden

```json
{
  "success": false,
  "error": "You are not an instructor"
}
```

### 4. Updating Someone Else's Course

**Expected Response:** 403 Forbidden

```json
{
  "success": false,
  "error": "Course not found or you don't have permission to update it"
}
```

### 5. Empty Request (No Fields)

**Expected Response:** 400 Bad Request

```json
{
  "success": false,
  "error": "At least one field must be provided to update"
}
```

---

## Postman Environment Variables

Setup environment variables để test dễ dàng:

```json
{
  "name": "FlyUp Development",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "token",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    {
      "key": "courseId",
      "value": "550e8400-e29b-41d4-a716-446655440000"
    },
    {
      "key": "sectionId",
      "value": "660e8400-e29b-41d4-a716-446655440001"
    },
    {
      "key": "lectureId",
      "value": "770e8400-e29b-41d4-a716-446655440002"
    }
  ]
}
```

---

## Performance Testing

### Load Testing Command

```bash
# Using Apache Bench
ab -n 100 -c 10 -H "Authorization: Bearer {{token}}" \
   -X PUT -d @update-request.json \
   http://localhost:3000/api/courses/{{courseId}}/update

# Using curl with loop
for i in {1..50}; do
  curl -X PUT "http://localhost:3000/api/courses/{{courseId}}/update" \
    -H "Authorization: Bearer {{token}}" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test '$i'"}'
done
```

---

## Thực hành

1. Export Postman Collection từ file này
2. Setup environment variables
3. Chạy requests lần lượt
4. Verify responses
5. Test error cases
6. Run load tests (optional)

Xem thêm: [INSTRUCTOR_UPDATE_COURSE_GUIDE.md](INSTRUCTOR_UPDATE_COURSE_GUIDE.md)
