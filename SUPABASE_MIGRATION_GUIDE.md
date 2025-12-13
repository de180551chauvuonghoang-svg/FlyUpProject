# Hướng Dẫn Chuyển Đổi CourseHubDB từ SQL Server sang Supabase

## 📋 Tổng Quan

File `supabase_migration.sql` đã được tạo để chuyển đổi database **CourseHubDB** từ SQL Server sang PostgreSQL (Supabase).

### Các Bảng Đã Chuyển Đổi (37 bảng):

| STT | Tên Bảng                | Mô Tả                        |
| --- | ----------------------- | ---------------------------- |
| 1   | Users                   | Thông tin người dùng         |
| 2   | Instructors             | Thông tin giảng viên         |
| 3   | Categories              | Danh mục khóa học            |
| 4   | Courses                 | Khóa học                     |
| 5   | Sections                | Chương/phần trong khóa học   |
| 6   | Lectures                | Bài giảng                    |
| 7   | LectureMaterial         | Tài liệu bài giảng           |
| 8   | LectureCompletions      | Tiến độ hoàn thành bài giảng |
| 9   | Assignments             | Bài tập/kiểm tra             |
| 10  | AssignmentCompletions   | Tiến độ hoàn thành bài tập   |
| 11  | McqQuestions            | Câu hỏi trắc nghiệm          |
| 12  | McqChoices              | Đáp án trắc nghiệm           |
| 13  | Submissions             | Bài nộp                      |
| 14  | McqUserAnswer           | Câu trả lời người dùng       |
| 15  | Enrollments             | Đăng ký khóa học             |
| 16  | CourseReviews           | Đánh giá khóa học            |
| 17  | CourseMeta              | Metadata khóa học            |
| 18  | CourseNotifications     | Thông báo khóa học           |
| 19  | Articles                | Bài viết                     |
| 20  | Tag                     | Tag bài viết                 |
| 21  | Comments                | Bình luận                    |
| 22  | CommentMedia            | Media trong bình luận        |
| 23  | Reactions               | Phản ứng (like, ...)         |
| 24  | Conversations           | Cuộc hội thoại               |
| 25  | ConversationMembers     | Thành viên hội thoại         |
| 26  | ChatMessages            | Tin nhắn chat                |
| 27  | PrivateConversations    | Hội thoại riêng              |
| 28  | PrivateMessages         | Tin nhắn riêng               |
| 29  | Notifications           | Thông báo                    |
| 30  | Bills                   | Hóa đơn                      |
| 31  | CartCheckout            | Giỏ hàng thanh toán          |
| 32  | UserAbilities           | Năng lực người dùng (CAT)    |
| 33  | CAT_Logs                | Log CAT                      |
| 34  | CAT_Results             | Kết quả CAT                  |
| 35  | \_\_EFMigrationsHistory | Lịch sử migration EF         |

---

## 🚀 Hướng Dẫn Triển Khai

### Bước 1: Tạo Project Supabase

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng nhập và tạo project mới
3. Chờ database được khởi tạo

### Bước 2: Chạy Migration

**Cách 1: Qua Supabase Dashboard**

1. Vào **SQL Editor** trong dashboard Supabase
2. Copy nội dung file `supabase_migration.sql`
3. Paste và nhấn **Run**

**Cách 2: Qua Supabase CLI**

```bash
# Cài đặt Supabase CLI
npm install -g supabase

# Đăng nhập
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Chạy migration
supabase db push --file supabase_migration.sql
```

### Bước 3: Import Dữ Liệu (Tùy chọn)

Nếu bạn muốn import dữ liệu từ SQL Server:

1. Export dữ liệu từ SQL Server ra CSV
2. Sử dụng Supabase Dashboard để import CSV vào từng bảng

---

## ⚠️ Các Thay Đổi Quan Trọng

### Khác Biệt SQL Server vs PostgreSQL

| Feature        | SQL Server         | PostgreSQL/Supabase    |
| -------------- | ------------------ | ---------------------- |
| UUID           | `uniqueidentifier` | `UUID`                 |
| Auto-increment | `IDENTITY(1,1)`    | `SERIAL` / `BIGSERIAL` |
| Boolean        | `BIT`              | `BOOLEAN`              |
| Datetime       | `DATETIME2(7)`     | `TIMESTAMP`            |
| Max string     | `NVARCHAR(MAX)`    | `TEXT`                 |
| Tinyint        | `TINYINT`          | `SMALLINT`             |

### Function Đã Chuyển Đổi

- `GetCheckoutStats` → `get_checkout_stats()` (PostgreSQL function)

---

## 🔐 Row Level Security (RLS)

Supabase sử dụng Row Level Security để bảo mật. Các policy mẫu đã được comment trong file migration. Uncomment và tùy chỉnh theo nhu cầu:

```sql
-- Enable RLS
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;

-- Tạo policy
CREATE POLICY "Users can view own data" ON "Users"
    FOR SELECT USING (auth.uid() = "Id");
```

---

## 🔧 Cấu Hình Backend

Cập nhật connection string trong backend:

```env
# Trước (SQL Server)
DATABASE_URL=Server=localhost;Database=CourseHubDB1;...

# Sau (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

---

## 📝 Lưu Ý

1. **UUID Extension**: File đã bao gồm `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
2. **Foreign Keys**: Tất cả quan hệ khóa ngoại đã được tạo
3. **Indexes**: Các index quan trọng đã được thêm
4. **Data Migration**: File này chỉ tạo cấu trúc, không import data

---

## 🆘 Hỗ Trợ

Nếu gặp lỗi khi chạy migration, hãy kiểm tra:

1. UUID extension đã được enable
2. Các bảng được tạo theo đúng thứ tự (file đã xử lý)
3. Connection đến Supabase project đúng
