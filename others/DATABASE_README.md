# Tài liệu Chi tiết Cấu trúc Cơ sở dữ liệu (Detailed Database Schema)

Tài liệu này cung cấp mô tả kỹ thuật đầy đủ và chi tiết cho từng bảng, trường dữ liệu, và các mối quan hệ trong cơ sở dữ liệu của dự án FlyUpProject.

Dữ liệu được quản lý bởi **Prisma ORM** và sử dụng hệ quản trị cơ sở dữ liệu **PostgreSQL**.

---

## Mục lục

1.  [Bảng Người dùng & Phân quyền (Users & Auth)](#1-bảng-người-dùng--phân-quyền)
    *   [Users](#users)
    *   [Instructors](#instructors)
2.  [Bảng Khóa học & Nội dung (Courses & Content)](#2-bảng-khóa-học--nội-dung)
    *   [Courses](#courses)
    *   [Categories](#categories)
    *   [Sections](#sections)
    *   [Lectures](#lectures)
    *   [LectureMaterial](#lecturematerial)
    *   [CourseMeta](#coursemeta)
    *   [Tag](#tag)
3.  [Bảng Học tập & Tiến độ (Learning & Progress)](#3-bảng-học-tập--tiến-độ)
    *   [Enrollments](#enrollments)
    *   [LectureCompletions](#lecturecompletions)
    *   [UserAbilities](#userabilities)
    *   [Wishlist](#wishlist)
4.  [Bảng Bài tập & Đánh giá (Assignments & Assessment)](#4-bảng-bài-tập--đánh-giá)
    *   [Assignments](#assignments)
    *   [AssignmentCompletions](#assignmentcompletions)
    *   [McqQuestions](#mcqquestions)
    *   [McqChoices](#mcqchoices)
    *   [Submissions](#submissions)
    *   [McqUserAnswer](#mcquseranswer)
    *   [CAT_Logs](#cat_logs)
    *   [CAT_Results](#cat_results)
5.  [Bảng Tương tác & Cộng đồng (Community & Social)](#5-bảng-tương-tác--cộng-đồng)
    *   [Articles](#articles)
    *   [Comments](#comments)
    *   [CommentMedia](#commentmedia)
    *   [Reactions](#reactions)
    *   [CourseReviews](#coursereviews)
    *   [Conversations](#conversations)
    *   [ConversationMembers](#conversationmembers)
    *   [ChatMessages](#chatmessages)
    *   [PrivateConversations](#privateconversations)
    *   [PrivateMessages](#privatemessages)
    *   [Notifications](#notifications)
    *   [CourseNotifications](#coursenotifications)
6.  [Bảng Thanh toán (Billing)](#6-bảng-thanh-toán)
    *   [Bills](#bills)
    *   [CartCheckout](#cartcheckout)
7.  [Bảng Hệ thống (System)](#7-bảng-hệ-thống)
    *   [EFMigrationsHistory](#efmigrationshistory)

---

## 1. Bảng Người dùng & Phân quyền

### `Users`
Bảng trung tâm lưu trữ mọi người dùng (Học viên, Giảng viên, Admin).

| Tên trường | Kiểu dữ liệu | Ràng buộc / Mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- |
| `Id` | UUID | PK, unique | ID định danh người dùng. Sinh tự động `uuid_generate_v4()`. |
| `UserName` | VarChar(45) | | Tên đăng nhập. Có index tìm kiếm. |
| `Password` | VarChar(100)| | Mật khẩu đã băm (hashed). |
| `Email` | VarChar(45) | | Email liên hệ. Có index tìm kiếm. |
| `FullName` | VarChar(45) | | Tên hiển thị. |
| `MetaFullName`| VarChar(45) | | Tên dùng cho mục đích tìm kiếm (thường là không dấu, chữ thường). |
| `AvatarUrl` | VarChar(100)| | Đường dẫn ảnh đại diện. |
| `Role` | String | | Vai trò người dùng (VD: 'Student', 'Instructor', 'Admin'). |
| `Token` | VarChar(100)| | Token xác thực hiện tại (nếu dùng cơ chế token đơn giản). |
| `RefreshToken`| VarChar(100)| | Token làm mới phiên đăng nhập. |
| `IsVerified` | Boolean | Default: `false` | Email đã được xác thực chưa? |
| `IsApproved` | Boolean | Default: `false` | Tài khoản đã được duyệt chưa (dùng cho Instructor). |
| `AccessFailedCount` | Int | Default: `0` | Số lần đăng nhập sai liên tiếp. |
| `LoginProvider`| VarChar(100)| Nullable | Nhà cung cấp đăng nhập (VD: 'Google', 'Facebook'). |
| `ProviderKey` | VarChar(100)| Nullable | ID người dùng từ bên thứ 3. |
| `Bio` | VarChar(1000)| Default: "" | Tiểu sử ngắn. |
| `DateOfBirth` | DateTime | Nullable | Ngày sinh. |
| `Phone` | VarChar(45) | Nullable | Số điện thoại. |
| `EnrollmentCount`| Int | Default: `0` | Số lượng khóa học đã tham gia. |
| `InstructorId` | UUID | FK | Link tới bảng `Instructors` nếu là giảng viên (1-1). |
| `SystemBalance` | BigInt | Default: `0` | Số dư tài khoản trong hệ thống (VND). |
| `CreationTime` | DateTime | Default: `now()` | Ngày tạo tài khoản. |

### `Instructors`
Thông tin bổ sung cho người dùng đóng vai trò Giảng viên.

| Tên trường | Kiểu dữ liệu | Ràng buộc / Mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- |
| `Id` | UUID | PK | ID giảng viên (khác ID User, nhưng liên kết chặt chẽ). |
| `CreatorId` | UUID | FK (Unique) | ID của User tương ứng. Quan hệ 1-1. |
| `Intro` | VarChar(500)| Default: "" | Giới thiệu ngắn gọn. |
| `Experience` | VarChar(1000)| Default: "" | Mô tả kinh nghiệm giảng dạy. |
| `Balance` | BigInt | Default: `0` | Số dư thu nhập từ khóa học. |
| `CourseCount` | Int | Default: `0` | Số khóa học đã tạo. |

---

## 2. Bảng Khóa học & Nội dung

### `Courses`
Bảng lưu trữ thông tin khóa học.

| Tên trường | Kiểu dữ liệu | Ràng buộc / Mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- |
| `Id` | UUID | PK | ID khóa học. |
| `Title` | VarChar(255)| | Tiêu đề khóa học. |
| `ThumbUrl` | VarChar(255)| Default: "" | Ảnh thumbnail. |
| `Price` | Float | Default: `0` | Giá gốc khóa học. |
| `Discount` | Float | Default: `0` | Giá khuyến mãi hoặc % giảm. |
| `DiscountExpiry`| DateTime | | Thời hạn giảm giá. |
| `Status` | String | Default: "Draft" | Trạng thái: 'Draft', 'Published', 'Hidden'. |
| `ApprovalStatus`| VarChar(50)| Default: "Pending"| Trạng thái duyệt của Admin. |
| `Level` | String | Default: "Beginner" | Trình độ: 'Beginner', 'Intermediate', 'Advanced'. |
| `LeafCategoryId`| UUID | FK | ID danh mục con nhất chứa khóa học này. |
| `InstructorId` | UUID | FK | ID giảng viên sở hữu khóa học. |
| `RatingCount` | Int | Default: `0` | Tổng số lượt đánh giá. |
| `TotalRating` | BigInt | Default: `0` | Tổng điểm đánh giá (RatingCount * AvgRating). |
| `LearnerCount` | Int | Default: `0` | Số học viên đang học. |

### `Categories`
Danh mục phân loại khóa học theo cấu trúc cây (Category Tree).

| Tên trường | Kiểu dữ liệu | Ràng buộc / Mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- |
| `Id` | UUID | PK | ID danh mục. |
| `Title` | VarChar(100)| | Tên danh mục. |
| `Path` | VarChar(255)| | Đường dẫn phân cấp (VD: /IT/Web/Backend). |
| `IsLeaf` | Boolean | Default: `false` | True nếu là danh mục cuối cùng chứa khóa học. |
| `CourseCount` | Int | Default: `0` | Số khóa học trong danh mục. |

### `Sections`
Các chương (Module) trong khóa học.
*   **Quan hệ**: 1 Course -> N Sections.
*   **Trường quan trọng**: `Index` (thứ tự hiển thị), `CourseId` (FK).

### `Lectures`
Các bài giảng trong một chương.
*   **Quan hệ**: 1 Section -> N Lectures.
*   **Trường quan trọng**: `Content` (Nội dung HTML/Text), `IsPreviewable` (Cho phép học thử).

### `LectureMaterial`
Tài liệu học tập đính kèm bài giảng.
*   **Trường quan trọng**: `Type` (Video mp4, PDF doc, Github link...), `Url` (Link tải/xem).

### `CourseMeta`
Lưu các thông tin bổ sung linh động cho khóa học (Tag, Meta data).
*   **PK**: `[CourseId, Id]` (Composite Key).

### `Tag`
Gắn bài viết (`Articles`) với các từ khóa.

---

## 3. Bảng Học tập & Tiến độ

### `Enrollments`
Bảng ghi danh (User mua Course).
**Khóa chính (PK):** `[CreatorId, CourseId]` (Một user chỉ mua một khóa học một lần).

| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `CreatorId` | UUID | ID học viên. |
| `CourseId` | UUID | ID khóa học. |
| `Status` | String | Trạng thái học (Active, Completed, Expired). |
| `LectureMilestones` | String (JSON) | Chuỗi JSON lưu danh sách các ID bài giảng đã hoàn thành. |
| `LastViewedLectureId` | UUID | Bài giảng user xem lần cuối cùng. |
| `BillId` | UUID | Hóa đơn thanh toán cho lần ghi danh này. |

### `LectureCompletions`
Lưu lịch sử hoàn thành từng bài giảng chi tiết hơn `Enrollments`.
*   Dùng để tính % hoàn thành khóa học chính xác và tạo báo cáo.

### `UserAbilities`
Lưu trữ năng lực người học theo mô hình IRT (Item Response Theory) cho việc học thích ứng (Adaptive Learning).
*   `Theta`: Chỉ số năng lực hiện tại của người học cho khóa học đó.

### `Wishlist`
Danh sách khóa học người dùng yêu thích. PK: `[UserId, CourseId]`.

---

## 4. Bảng Bài tập & Đánh giá

### `Assignments`
Bài tập trắc nghiệm.
*   `GradeToPass`: Điểm tối thiểu để qua.
*   `Duration`: Thời gian giới hạn (phút).

### `AssignmentCompletions`
Ghi nhận việc user đã hoàn thành bài tập nào, vào lúc nào.

### `McqQuestions` & `McqChoices`
*   `McqQuestions`: Câu hỏi trắc nghiệm. Có các tham số `ParamA`, `ParamB`, `ParamC` dùng cho tính toán độ khó trong thuật toán CAT.
*   `McqChoices`: Các lựa chọn đáp án. `IsCorrect` = true là đáp án đúng.

### `Submissions`
Lần nộp bài của học viên.
*   `Mark`: Điểm số đạt được.
*   `TimeSpentInSec`: Thời gian làm bài (giây).

### `McqUserAnswer`
Chi tiết từng câu trả lời trong một bài nộp (`Submissions`). Lưu user đã chọn `McqChoice` nào.

### `CAT_Logs` & `CAT_Results`
Hệ thống log cho thi trắc nghiệm thích ứng.
*   `CAT_Logs`: Lưu từng bước nhảy của thuật toán (Câu hỏi nào được chọn? Theta trước/sau khi trả lời?).
*   `CAT_Results`: Kết quả tổng hợp sau phiên thi (Theta cuối cùng, số câu đúng/sai).

---

## 5. Bảng Tương tác & Cộng đồng

### `Articles`
Bài viết blog/chia sẻ kiến thức.
*   `Status`: 'Draft', 'Published'.
*   `ViewCount`, `CommentCount`: Thống kê tương tác.

### `Comments`
Hệ thống bình luận phân cấp (Nested Comments).
*   Link tới `Articles`, `Lectures` hoặc `ParentId` (trả lời comment khác).

### `Reactions`
Lưu "Like", "Haha", "Heart"... cho Articles, Messages, Comments.
*   `SourceType`: Xác định loại đối tượng được react.

### `Conversations` & `ChatMessages` & `ConversationMembers`
Hệ thống Chat nhóm hoặc chat 1-1.
*   `Conversations`: Nhóm chat.
*   `ChatMessages`: Nội dung tin nhắn.
*   `ConversationMembers`: Ai đang ở trong nhóm chat nào? (Có phải Admin nhóm không?).

### `PrivateConversations` & `PrivateMessages`
Hệ thống chat riêng tư (Direct Message) đơn giản hơn, lưu trữ tin nhắn giữa 2 user ID cụ thể.

### `Notifications` & `CourseNotifications`
*   `Notifications`: Thông báo chung (hệ thống, tương tác xã hội).
*   `CourseNotifications`: Thông báo liên quan khóa học (Duyệt khóa học, học viên mới...).

---

## 6. Bảng Thanh toán

### `Bills`
Hóa đơn giao dịch nạp tiền hoặc thanh toán.

| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `Id` | UUID | Mã hóa đơn. |
| `Amount` | BigInt | Số tiền. |
| `Gateway` | String | Cổng thanh toán (VNPAY, Momo, VietQR). |
| `TransactionId`| String | Mã tham chiếu từ cổng thanh toán (để đối soát). |
| `IsSuccessful` | Boolean | Giao dịch thành công hay thất bại. |
| `CreatorId` | UUID | Người thực hiện giao dịch. |

### `CartCheckout`
Bảng tạm lưu trạng thái thanh toán giỏ hàng.
*   `Status`: 'PENDING', 'SUCCESS', 'FAILED'.
*   `CourseIds`: JSON mảng các ID khóa học đang mua.

---

## 7. Bảng Hệ thống

### `EFMigrationsHistory`
Bảng nội bộ của Entity Framework (nếu dự án migrate từ .NET) để quản lý lịch sử migration database.
