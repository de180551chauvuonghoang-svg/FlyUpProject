# III. Design Specifications

## 1. Authentication & User Management

### 1.1 Authentication

**a. Login**

_Màn hình đăng nhập hệ thống dành cho người dùng (Learner/Instructor). Cho phép xác thực qua Email/Password hoặc đăng nhập nhanh bằng nền tảng thứ ba (Google, GitHub)._

#### UI Design

_Giao diện đăng nhập gồm các trường nhập liệu cơ bản, nút điều hướng và nút đăng nhập nhanh bằng mạng xã hội._

**<<Mockup prototype>>** _(Login Screen Image)_

| Field Name         | Field Type           | Description                                                             |
| :----------------- | :------------------- | :---------------------------------------------------------------------- |
| **Login Form**     |                      |                                                                         |
| `Email Address`    | `TextBox`            | Trường nhập địa chỉ email người dùng (Bắt buộc). Định dạng chuẩn email. |
| `Password`         | `TextBox (Password)` | Trường nhập mật khẩu (Bắt buộc). Cho phép ẩn/hiện mật khẩu.             |
| `Log In`           | `Button`             | Nút xác thực thông tin và đăng nhập hệ thống.                           |
| `Forgot password?` | `Link`               | Chuyển hướng đến màn hình lấy lại mật khẩu.                             |
| `Sign Up`          | `Link`               | Chuyển hướng đến màn hình Đăng ký tài khoản.                            |
| **Social Login**   |                      |                                                                         |
| `Google`           | `Button`             | Đăng nhập bằng tài khoản Google (OAuth2).                               |
| `Facebook`         | `Button`             | Đăng nhập bằng tài khoản Facebook (Chưa implement).                     |
| `GitHub`           | `Button`             | Đăng nhập bằng tài khoản GitHub (OAuth2).                               |

#### Database Access

_Xác thực thông tin tài khoản và sinh Refresh Token cho phiên đăng nhập._

| Table   | CRUD             | Description                                                                                |
| :------ | :--------------- | :----------------------------------------------------------------------------------------- |
| `Users` | `Read`, `Update` | Truy vấn kiểm tra Email và Password. Cập nhật `RefreshToken` sau khi đăng nhập thành công. |

#### SQL Commands

_Các lệnh SQL tương đương cho chức năng Login._

```sql
-- Read user by Email
SELECT * FROM "Users" WHERE "Email" = '[input_email]';

-- Update Refresh Token after successful authentication
UPDATE "Users" SET "RefreshToken" = '[hash_token]' WHERE "Id" = '[user_id]';
```

---

**b. Sign Up**

_Màn hình đăng ký tài khoản mới. Cho phép người dùng chọn vai trò (Learner/Instructor) và nhập thông tin cơ bản trước khi xác minh Email (OTP)._

#### UI Design

_Giao diện đăng ký tài khoản gồm các thông tin định danh cơ bản và lựa chọn loại tài khoản._

**<<Mockup prototype>>** _(Sign Up Screen Image)_

| Field Name               | Field Type    | Description                                                                                            |
| :----------------------- | :------------ | :----------------------------------------------------------------------------------------------------- |
| **Registration Form**    |               |                                                                                                        |
| `Full Name`              | `TextBox`     | Họ và tên của người dùng mới (Bắt buộc).                                                               |
| `Email`                  | `TextBox`     | Địa chỉ email dùng để đăng ký và đăng nhập (Bắt buộc).                                                 |
| `I want to join as`      | `Radio Group` | Lựa chọn vai trò: `Learner` hoặc `Instructor`.                                                         |
| `Send Verification Code` | `Button`      | Gửi mã OTP xác thực đến email đã nhập. Các bước tiếp theo (nhập OTP/Password) được xử lý sau bước này. |
| `Log In`                 | `Link`        | Chuyển hướng về màn hình Đăng nhập nếu đã có tài khoản.                                                |

#### Database Access

_Kiểm tra email trùng lặp, lưu trữ mã OTP xác thực và tạo bản ghi người dùng mới._

| Table                | CRUD                                 | Description                                                            |
| :------------------- | :----------------------------------- | :--------------------------------------------------------------------- |
| `Users`              | `Read`, `Create`                     | Kiểm tra tồn tại qua `Email`. Tạo bản ghi user mới sau khi OTP hợp lệ. |
| `EmailVerifications` | `Read`, `Create`, `Update`, `Delete` | Tạo mới/Cập nhật OTP cho email. Xóa sau khi xác thực thành công.       |

#### SQL Commands

_Các lệnh SQL tương đương cho quá trình Sign Up._

```sql
-- Check if email exists
SELECT * FROM "Users" WHERE "Email" = '[input_email]';

-- Upsert Email OTP
INSERT INTO "EmailVerifications" ("Email", "OtpHash", "ExpiresAt", "CreatedAt", "AttemptCount")
VALUES ('[input_email]', '[hash]', '[time]', '[time]', 0)
ON CONFLICT ("Email") DO UPDATE SET "OtpHash" = '[hash]', "ExpiresAt" = '[time]';

-- Create newly verified User
INSERT INTO "Users" ("Id", "UserName", "Password", "Email", "FullName", "MetaFullName", "Role", "RefreshToken", "IsVerified", "IsApproved", "SystemBalance", ...)
VALUES ('[uuid]', '[generated]', '[hash]', '[input_email]', '[name]', '[meta_name]', '[role]', '[hash]', TRUE, FALSE, 0, ...);
```

---

**c. Forgot Password**

_Màn hình yêu cầu lấy lại mật khẩu thông qua liên kết (link) xác thực gửi về Email._

#### UI Design

_Giao diện nhập Email để khôi phục tài khoản._

**<<Mockup prototype>>** _(Forgot Password Screen Image)_

| Field Name        | Field Type | Description                                    |
| :---------------- | :--------- | :--------------------------------------------- |
| **Reset Form**    |            |                                                |
| `Email Address`   | `TextBox`  | Email của tài khoản cần lấy lại mật khẩu.      |
| `Send Reset Link` | `Button`   | Gửi đường link khôi phục đến email người dùng. |
| `Back to Login`   | `Link`     | Chuyển hướng về màn hình Đăng nhập.            |

#### Database Access

_Kiểm tra sự tồn tại của tài khoản và lưu mã Reset Token vào cơ sở dữ liệu._

| Table   | CRUD             | Description                                                                        |
| :------ | :--------------- | :--------------------------------------------------------------------------------- |
| `Users` | `Read`, `Update` | Lấy user ID từ Email. Cập nhật mã sinh ngẫu nhiên vào cột `Token` làm Reset Token. |

#### SQL Commands

_Các lệnh SQL tương đương cho Forgot Password._

```sql
-- Verify user email exists
SELECT * FROM "Users" WHERE "Email" = '[input_email]';

-- Store reset token (currently using Token field)
UPDATE "Users" SET "Token" = '[uuid_token]' WHERE "Id" = '[user_id]';
```

---

### 1.2 User Management

**a. Profile Settings (Information)**

_Màn hình thông tin hồ sơ người dùng trong panel `Settings`. Cho phép xem và cập nhật thông tin cá nhân cơ bản._

#### UI Design

_Giao diện hiển thị các thông tin liên hệ và định danh của người dùng hiện tại._

**<<Mockup prototype>>** _(Profile Screen Image)_

| Field Name               | Field Type            | Description                                              |
| :----------------------- | :-------------------- | :------------------------------------------------------- |
| **Profile Picture**      |                       |                                                          |
| `Avatar`                 | `Image`               | Hình đại diện hiện tại của User (`AvatarUrl`).           |
| `Change Photo`           | `Button`              | Upload/Đổi ảnh đại diện mới.                             |
| **Personal Information** |                       |                                                          |
| `Full Name`              | `TextBox`             | Tên đầy đủ của người dùng.                               |
| `Role`                   | `TextBox (Read-only)` | Vai trò hiện tại (VD: `instructor`). Không cho phép đổi. |
| `Date of Birth`          | `DatePicker`          | Ngày tháng năm sinh.                                     |
| `Phone Number`           | `TextBox`             | Số điện thoại liên hệ.                                   |
| `Email Address`          | `TextBox (Read-only)` | Địa chỉ Email, không cho chỉnh sửa trực tiếp tại đây.    |
| `Bio`                    | `TextArea`            | Đoạn văn bản giới thiệu ngắn gọn về bản thân.            |
| `Save Profile`           | `Button`              | Lưu và cập nhật các thông tin cá nhân.                   |

#### Database Access

_Cập nhật các thông tin cá nhân của người dùng._

| Table   | CRUD             | Description                                                                                                          |
| :------ | :--------------- | :------------------------------------------------------------------------------------------------------------------- |
| `Users` | `Read`, `Update` | Đọc thông tin hiện tại và Cập nhật (`FullName`, `Bio`, `Phone`, `DateOfBirth`, `AvatarUrl`, `LastModificationTime`). |

#### SQL Commands

_Các lệnh SQL tương đương cho Profile Settings._

```sql
-- Fetch User Profile
SELECT "Id", "UserName", "Email", "FullName", "AvatarUrl", "Bio", "Role", "DateOfBirth", "Phone"
FROM "Users" WHERE "Id" = '[user_id]';

-- Update User Profile
UPDATE "Users"
SET "FullName" = '[new_name]', "Bio" = '[new_bio]', "Phone" = '[new_phone]',
    "DateOfBirth" = '[new_dob]', "AvatarUrl" = '[new_avatar]', "LastModificationTime" = '[now]'
WHERE "Id" = '[user_id]';
```

---

**b. Change Password (Security)**

_Màn hình đổi mật khẩu trong panel `Settings` -> `Security`._

#### UI Design

_Giao diện nhập mật khẩu cũ/mới và đánh giá độ mạnh của mật khẩu mới._

**<<Mockup prototype>>** _(Change Password Screen Image)_

| Field Name               | Field Type           | Description                                                                     |
| :----------------------- | :------------------- | :------------------------------------------------------------------------------ |
| **Password Update Form** |                      |                                                                                 |
| `Current Password`       | `TextBox (Password)` | Yêu cầu nhập đúng mật khẩu hiện tại (Bắt buộc).                                 |
| `New Password`           | `TextBox (Password)` | Mật khẩu mới muốn thay đổi (Bắt buộc).                                          |
| `Confirm New Password`   | `TextBox (Password)` | Nhập lại mật khẩu mới để xác nhận khớp.                                         |
| `Update Password`        | `Button`             | Thực thi đổi mật khẩu.                                                          |
| **Password Strength**    |                      |                                                                                 |
| `Rules List`             | `Checklist`          | Kiểm tra động các điều kiện: >8 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt. |

#### Database Access

_Kiểm tra mật khẩu cũ và lưu mật khẩu mới đã mã hóa._

| Table   | CRUD             | Description                                                          |
| :------ | :--------------- | :------------------------------------------------------------------- |
| `Users` | `Read`, `Update` | Trích xuất hash password cũ để kiểm tra. Cập nhật hash password mới. |

#### SQL Commands

_Các lệnh SQL tương đương cho Change Password._

```sql
-- Read current user to verify old password hash
SELECT "Password", "LoginProvider" FROM "Users" WHERE "Id" = '[user_id]';

-- Update to new password
UPDATE "Users" SET "Password" = '[new_hash]' WHERE "Id" = '[user_id]';
```
