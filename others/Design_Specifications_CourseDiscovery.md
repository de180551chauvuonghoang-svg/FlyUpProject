# III. Design Specifications

## 2. Course Discovery & Learning

### 2.1 Course Discovery

**a. Home Page**

_Màn hình Trang chủ của FlyUp, nơi hiển thị các chứng chỉ/khóa học nổi bật, thống kê về cộng đồng học tập, danh mục các khóa học và định hướng lộ trình học tập để người dùng dễ dàng khám phá._

#### UI Design

_Giao diện Landing Page với khối Banner chính, số liệu thống kê (Statistics) và danh sách Categories._

**<<Mockup prototype>>** _(Home Page Image)_

| Field Name                 | Field Type     | Description                                                                                             |
| :------------------------- | :------------- | :------------------------------------------------------------------------------------------------------ |
| **Hero Banner**            |                |                                                                                                         |
| `Headline`                 | `Text`         | Tiêu đề chính thu hút người dùng ("Unlock Your Potential...").                                          |
| `Start Learning`           | `Button`       | Nút Call-to-action chuyển đến trang danh sách khóa học.                                                 |
| `Featured Course Card`     | `Card`         | Thẻ hiển thị một khóa học nổi bật (Ví dụ: "react").                                                     |
| **Statistics & Community** |                |                                                                                                         |
| `Active Students`          | `Label`        | Hiển thị tổng số người học đang hoạt động (Ví dụ: 10.0K).                                               |
| `Expert Courses`           | `Label`        | Hiển thị tổng số khóa học trên hệ thống.                                                                |
| `Top Instructors`          | `Label`        | Hiển thị số lượng giảng viên, chuyên gia.                                                               |
| `Success Rate`             | `Label`        | Hiển thị tỷ lệ hoàn thành/đánh giá tốt.                                                                 |
| **Categories**             |                |                                                                                                         |
| `Category Pills`           | `Button Group` | Danh sách các lĩnh vực (Design, Development, Marketing,...). Nhấp vào sẽ lọc khóa học theo Category đó. |

#### Database Access

_Truy vấn dữ liệu thống kê tổng quan và danh sách các Category đang có trên hệ thống._

| Table        | CRUD   | Description                                                              |
| :----------- | :----- | :----------------------------------------------------------------------- |
| `Categories` | `Read` | Lấy danh sách các danh mục cấp độ lá (Leaf Category) để hiển thị.        |
| `Users`      | `Read` | Query số lượng người dùng (Learners & Instructors) để hiển thị thống kê. |
| `Courses`    | `Read` | Query tổng số khóa học đã duyệt (`APPROVED`).                            |

#### SQL Commands

_Các lệnh SQL tương đương cho Home Page._

```sql
-- Get Active Categories (Leaf nodes)
SELECT "Id", "Title", "CourseCount", "Path"
FROM "Categories" WHERE "IsLeaf" = TRUE ORDER BY "Title" ASC;

-- Get Statistics (Simulated aggregations)
SELECT COUNT(*) FROM "Users" WHERE "Role" = 'learner';
SELECT COUNT(*) FROM "Users" WHERE "Role" = 'instructor';
SELECT COUNT(*) FROM "Courses" WHERE "ApprovalStatus" = 'APPROVED';
```

---

**b. Courses Page**

_Màn hình Danh sách khóa học. Cho phép người dùng tìm kiếm, lọc khóa học theo danh mục, cấp độ, giá cả và xem tổng quan thông tin các khóa học dưới dạng lưới (Grid)._

#### UI Design

_Giao diện gồm thanh Tìm kiếm, các bộ Lọc (Filters) và danh sách thẻ Khóa học (Course Cards)._

**<<Mockup prototype>>** _(Courses Page Image)_

| Field Name           | Field Type        | Description                                                                                 |
| :------------------- | :---------------- | :------------------------------------------------------------------------------------------ |
| **Search & Filters** |                   |                                                                                             |
| `Search Input`       | `TextBox`         | Tìm khóa học theo tên, mô tả.                                                               |
| `Category Filter`    | `Select/Dropdown` | Lọc theo danh mục khóa học (All Categories,...).                                            |
| `Level Filter`       | `Select/Dropdown` | Lọc theo trình độ (All Levels, Beginner, Intermediate, Expert).                             |
| `Price Filter`       | `Select/Dropdown` | Lọc theo khoảng giá (All Prices, Free, Paid).                                               |
| **Course List Grid** |                   |                                                                                             |
| `Course Card`        | `Card`            | Thẻ thông tin khóa học (chứa Thumbnail, Category, Title, Creator, Price, Rating, Duration). |
| `Add To Cart`        | `Button`          | Nút thêm khóa học vào giỏ hàng ngay từ thẻ.                                                 |
| `Pagination`         | `Pager`           | Component phân trang (1, 2, 3, 4...).                                                       |

#### Database Access

_Truy vấn danh sách khóa học dựa trên các điều kiện lọc (Filters) và phân trang._

| Table     | CRUD   | Description                                                                                                             |
| :-------- | :----- | :---------------------------------------------------------------------------------------------------------------------- |
| `Courses` | `Read` | Lấy thông tin khóa học (Title, Price, ThumbUrl, Rating,...), có kết nối với bảng `Categories` và `Users` (Instructors). |

#### SQL Commands

_Các lệnh SQL tương đương cho chức năng Filter & Listing._

```sql
-- Get filtered and paginated courses
SELECT c."Id", c."Title", c."Intro", c."ThumbUrl", c."Price", c."Level",
       c."TotalRating", c."RatingCount", c."LectureCount", c."LearnerCount",
       cat."Title" as "CategoryTitle",
       u."FullName" as "InstructorName", u."AvatarUrl"
FROM "Courses" c
JOIN "Categories" cat ON c."LeafCategoryId" = cat."Id"
JOIN "Instructors" i ON c."CreatorId" = i."CreatorId"
JOIN "Users" u ON i."CreatorId" = u."Id"
WHERE c."ApprovalStatus" = 'APPROVED' AND c."Status" = 'Ongoing'
  AND (c."Title" ILIKE '%[search_term]%' OR c."Description" ILIKE '%[search_term]%')
  AND c."LeafCategoryId" = '[category_id]'
  AND c."Level" = '[level]'
ORDER BY c."CreationTime" DESC
LIMIT [limit] OFFSET [skip];
```

---

### 2.2 Course Details & Learning

**a. Course Details Page**

_Màn hình hiển thị toàn bộ thông tin chi tiết của một khóa học cụ thể, bao gồm mô tả, mục tiêu học tập, danh sách bài giảng (Curriculum), thông tin giảng viên và các đánh giá (Reviews)._

#### UI Design

_Giao diện phân chia làm Nội dung chính (Trái) và Khối thanh toán/Đăng ký (Phải)._

**<<Mockup prototype>>** _(Course Details Page Image)_

| Field Name                    | Field Type     | Description                                                                   |
| :---------------------------- | :------------- | :---------------------------------------------------------------------------- |
| **Course Header & Info**      |                |                                                                               |
| `Course Title`                | `Text`         | Tên khóa học.                                                                 |
| `Rating & Students`           | `Label`        | Hiển thị sao đánh giá trung bình và số lượng học viên.                        |
| `Preview Video`               | `Video Player` | Video giới thiệu khóa học (Trailer).                                          |
| **Content Tabs**              |                |                                                                               |
| `Tabs Navigation`             | `Tabs`         | Các tab chuyển đổi nội dung: Overview, Curriculum, Instructor, Reviews.       |
| `What you'll learn`           | `List`         | Danh sách các kiên thức/kỹ năng đạt được.                                     |
| `Description`                 | `TextBlock`    | Mô tả chi tiết về nội dung khóa học.                                          |
| `Course Content (Curriculum)` | `Accordion`    | Danh sách các chương (Sections) và bài học (Lectures) có thể mở rộng/thu gọn. |
| `Instructor Card`             | `Card`         | Thông tin sơ lược về giảng viên (Avatar, Tên, Số khóa học, Học viên).         |
| **Floating Action Card**      |                |                                                                               |
| `Price`                       | `Label`        | Giá hiện tại của khóa học.                                                    |
| `Add to Cart`                 | `Button`       | Nút thêm khóa học vào giỏ hàng.                                               |
| `Buy Now`                     | `Button`       | Đăng ký/Mua ngay lập tức khóa học.                                            |

#### Database Access

_Lấy chi tiết khóa học, bao gồm thông tin cấu trúc nội dung (Sections/Lectures) và Giảng viên._

| Table                   | CRUD   | Description                                                       |
| :---------------------- | :----- | :---------------------------------------------------------------- |
| `Courses`               | `Read` | Lấy chi tiết thông tin Course theo `Id`.                          |
| `Sections` & `Lectures` | `Read` | Lấy danh sách các chương và tên bài giảng để hiển thị Curriculum. |
| `Reviews`               | `Read` | Lấy danh sách đánh giá của khóa học (phân trang).                 |

#### SQL Commands

_Các lệnh SQL tương đương cho Course Details._

```sql
-- Get Course details with Instructors and Categories
SELECT * FROM "Courses" WHERE "Id" = '[course_id]' AND "ApprovalStatus" = 'APPROVED';

-- Get Sections and Lectures (Curriculum outline)
SELECT s."Id" as "SectionId", s."Title" as "SectionTitle",
       l."Id" as "LectureId", l."Title" as "LectureTitle"
FROM "Sections" s
LEFT JOIN "Lectures" l ON s."Id" = l."SectionId"
WHERE s."CourseId" = '[course_id]'
ORDER BY s."CreationTime" ASC;
```

---

**b. My Learning Page**

_Màn hình cá nhân hóa chứa danh sách các khóa học mà người dùng (Learner) đã mua/đăng ký tham gia. Cho phép tiếp tục học tập từ vị trí đang dang dở._

#### UI Design

_Giao diện danh sách khóa học đã đăng ký, kèm theo tiến trình học tập._

**<<Mockup prototype>>** _(My Learning Page Image)_

| Field Name               | Field Type    | Description                                                        |
| :----------------------- | :------------ | :----------------------------------------------------------------- |
| **Learning Stats**       |               |                                                                    |
| `All Courses`            | `Label`       | Tổng số khóa học đã tham gia.                                      |
| `Completed`              | `Label`       | Tổng số lượng khóa học đã hoàn tất.                                |
| `Hours Earned`           | `Label`       | Tổng thời gian đã học (nếu có).                                    |
| **Enrolled Course Grid** |               |                                                                    |
| `Course Card`            | `Card`        | Thẻ khóa học hiển thị (Thumbnail, Title, Instructor).              |
| `Progress Bar`           | `ProgressBar` | Thanh hiển thị % hoàn thành khóa học của user.                     |
| `Continue Learning`      | `Button`      | Nút để truy cập trực tiếp vào bài học (Player) cuối cùng đang học. |

#### Database Access

_Lấy danh sách các bản ghi Đăng ký (Enrollments) của user đang đăng nhập._

| Table         | CRUD   | Description                                              |
| :------------ | :----- | :------------------------------------------------------- |
| `Enrollments` | `Read` | Query danh sách khóa học dựa trên `CreatorId` (User ID). |
| `Courses`     | `Read` | Join để lấy thông tin khóa học tương ứng với Enrollment. |

#### SQL Commands

_Các lệnh SQL tương đương cho My Learning._

```sql
-- Get Enrolled courses for User
SELECT e.*, c."Title", c."ThumbUrl", c."TotalRating", c."RatingCount",
       u."FullName" as "InstructorName"
FROM "Enrollments" e
JOIN "Courses" c ON e."CourseId" = c."Id"
JOIN "Instructors" i ON c."CreatorId" = i."CreatorId"
JOIN "Users" u ON i."CreatorId" = u."Id"
WHERE e."CreatorId" = '[user_id]'
ORDER BY e."CreationTime" DESC
LIMIT [limit] OFFSET [skip];
```
