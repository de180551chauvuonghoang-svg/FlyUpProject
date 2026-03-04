# III. Design Specifications

## 4. Additional Features

### 4.1 Wishlist

_Màn hình quản lý danh sách khóa học yêu thích nằm trong trang My Learning. Lưu trữ các khóa học mà người dùng quan tâm nhưng chưa thanh toán._

#### UI Design

_Giao diện dạng lưới (Grid) hiển thị các thẻ khóa học nổi bật._

**<<Mockup prototype>>** _(Wishlist Image)_

| Field Name            | Field Type    | Description                                                           |
| :-------------------- | :------------ | :-------------------------------------------------------------------- |
| **Course Card**       |               |                                                                       |
| `Thumbnail`           | `Image`       | Hình ảnh tĩnh biểu tượng của khóa học.                                |
| `Remove (Heart Icon)` | `Button/Icon` | Bỏ lưu khóa học khỏi danh sách Wishlist (Trái tim màu đỏ).            |
| `Course Info`         | `Labels`      | Các nhãn hiển thị tên khóa học, giá bán, giảng viên, và đánh giá sao. |
| `Add to Cart`         | `Button`      | Nút thao tác chuyển khóa học từ Wishlist sang nhanh Giỏ hàng (Cart).  |

#### Database Access

_Thêm mới hoặc Xóa nhanh (Toggle) danh sách khóa học yêu thích lưu trữ theo từng User._

| Table      | CRUD                       | Description                                                                              |
| :--------- | :------------------------- | :--------------------------------------------------------------------------------------- |
| `Wishlist` | `Read`, `Create`, `Delete` | Hiển thị, thêm mới hoặc xóa khóa học khỏi danh sách yêu thích của người dùng (`UserId`). |
| `Courses`  | `Read`                     | Join để lấy thông tin chi tiết (tên, giá, thông tin giảng viên, thể loại...).            |

#### SQL Commands

_Các lệnh SQL tương đương cho thao tác Wishlist._

```sql
-- Toggle Wishlist (If exists, delete. If not, insert)
-- Check exists:
SELECT * FROM "Wishlist" WHERE "UserId" = '[user_id]' AND "CourseId" = '[course_id]';

-- If exists:
DELETE FROM "Wishlist" WHERE "UserId" = '[user_id]' AND "CourseId" = '[course_id]';
-- If not exists:
INSERT INTO "Wishlist" ("UserId", "CourseId") VALUES ('[user_id]', '[course_id]');

-- Get Wishlist Courses for UI
SELECT w.*, c."Title", c."Price", c."ThumbUrl"
FROM "Wishlist" w
JOIN "Courses" c ON w."CourseId" = c."Id"
WHERE w."UserId" = '[user_id]'
ORDER BY w."CreationTime" DESC;
```

---

### 4.2 Comments & Reviews

_Thành phần đánh giá được đặt bên dưới chi tiết khóa học. Cho phép học viên (bắt buộc đã tham gia khóa học - Active Enrollment) để lại bình chọn sao và bình luận nội dung._

#### UI Design

_Giao diện biểu mẫu (Form) nhập liệu và danh sách tổng hợp bình luận (Reviews Feed)._

**<<Mockup prototype>>** _(Course Details - Reviews Tab Image)_

| Field Name               | Field Type    | Description                                                                                          |
| :----------------------- | :------------ | :--------------------------------------------------------------------------------------------------- |
| **Write a Review Form**  |               |                                                                                                      |
| `Rating`                 | `Star Rating` | Đánh giá dao động từ 1 đến 5 sao (Bắt buộc).                                                         |
| `Your Review`            | `TextArea`    | Nhập nội dung văn bản đánh giá cá nhân của học viên.                                                 |
| `Submit Review`          | `Button`      | Gửi (Thêm mới/Cập nhật) đánh giá cho khóa học.                                                       |
| **Student Reviews List** |               |                                                                                                      |
| `Review Item`            | `Block`       | Hiển thị Avatar, Tên học viên, Số sao, Thời gian cập nhật và Nội dung bình luận.                     |
| `Empty State`            | `Label`       | Hiển thị thông báo "No reviews yet. Be the first to review!" nếu khóa học chưa có lượt đánh giá nào. |

#### Database Access

_Tạo và cập nhật đánh giá `CourseReviews`, đồng thời Transaction tính toán lại cộng dồn tổng số điểm sao `TotalRating` vào bảng `Courses`._

| Table           | CRUD                       | Description                                                                    |
| :-------------- | :------------------------- | :----------------------------------------------------------------------------- |
| `Enrollments`   | `Read`                     | (Authorization) Kiểm tra user bắt buộc phải có Enrollment trạng thái `Active`. |
| `CourseReviews` | `Create`, `Read`, `Update` | Lưu lại nhận xét và số sao của học viên. Nếu đã đánh giá thì thực hiện Update. |
| `Courses`       | `Update`                   | Tính toán cộng dồn `TotalRating` và `RatingCount`.                             |

#### SQL Commands

_Các lệnh SQL tương đương cho chức năng Review (Tạo mới)._

```sql
BEGIN TRAN;

-- 1. Check Enrollment exists
SELECT * FROM "Enrollments"
WHERE "CreatorId" = '[user_id]' AND "CourseId" = '[course_id]' AND "Status" = 'Active';

-- 2. Insert Review
INSERT INTO "CourseReviews" ("CourseId", "CreatorId", "LastModifierId", "Rating", "Content", "CreationTime")
VALUES ('[course_id]', '[user_id]', '[user_id]', [rating], '[text]', '[now]');

-- 3. Update Course Aggregate Stats
UPDATE "Courses"
SET "TotalRating" = "TotalRating" + [rating], "RatingCount" = "RatingCount" + 1
WHERE "Id" = '[course_id]';

COMMIT TRAN;
```

---

### 4.3 AI Chatbot Assistant

_Widget Chatbot trực tuyến có khả năng gợi ý khóa học và tư vấn người dùng dựa trên nhu cầu học tập (Vd: "Tôi muốn học Linux"), tích hợp mạnh mẽ tự nhiên thông qua AI Groq SDK._

#### UI Design

_Giao diện cửa sổ Chat pop-up ghim nổi (Floating) ở góc phải bên dưới màn hình._

**<<Mockup prototype>>** _(AI Chatbot Image)_

| Field Name              | Field Type          | Description                                                                              |
| :---------------------- | :------------------ | :--------------------------------------------------------------------------------------- |
| **Fly Up AI Counselor** |                     |                                                                                          |
| `Chat Bubble`           | `Button (Floating)` | Nút tròn mở rộng/thu gọn (Toggle) kích hoạt giao diện Chatbot ở góc giao diện.           |
| `Chat Window`           | `Panel/Modal`       | Khung hiển thị luồng nội dung trao đổi (Tin nhắn người dùng & Phản hồi từ AI).           |
| `Close Window`          | `Button`            | Nút tiêu đề (X, mũi tên) để đóng nhanh cửa sổ nhắn tin.                                  |
| `Message Input`         | `TextBox`           | Vùng nhập tin nhắn câu hỏi (Ví dụ placeholder: "Ask about courses...").                  |
| `Send`                  | `Button`            | Biểu tượng gửi (Paper Plane) đẩy gửi yêu cầu text lên hệ thống Backend xử lý thông minh. |

#### Database Access & Logic Processing

_AI Chatbot tự động truy xuất động danh sách khóa học thực trong Controller Backend để nhúng làm `Context/Knowledge Base` cho LLM Prompt, từ đó đưa ra câu trả lời thực tế._

| Table     | CRUD   | Description                                                                                                                                                          |
| :-------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Courses` | `Read` | Lấy danh sách toàn khóa học hợp lệ (`APPROVED`, `Ongoing`) bao gồm giá tiền, OutComes, giảng viên, chuyển đổi sang chuỗi text nội dung bối cảnh cho Chatbot định vị. |

#### Implementation Flow

_Mô tả cách thức AI vận hành xử lý ở Server Side._

```javascript
/* 
1. Query All Approved Courses from Database (Inject as Context Knowledge)
2. Construct Prompt = Context + System Pre-prompt Instructions + User Message
3. Call Groq SDK API to generate response based on Open Source models.
*/

// Example Logic Snippet implementation
const promptContext = `...course lists stringified with price, names...`;
const model = "openai/gpt-oss-20b";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const completion = await groq.chat.completions.create({
  messages: [
    {
      role: "user",
      content: `You are FlyUp AI Counselor. Context: ${promptContext}. Student: ${userMessage}`,
    },
  ],
  model: model,
  temperature: 0.5,
});

// Sends the textual AI Response payload to Frontend to render Markdown answers
const responseText = completion.choices[0]?.message?.content;
```
