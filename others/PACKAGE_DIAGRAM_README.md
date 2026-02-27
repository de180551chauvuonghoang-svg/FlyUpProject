# 📦 Package Diagram — Giải thích Dependencies

Tài liệu này giải thích ý nghĩa các đường phụ thuộc (dependencies) trong sơ đồ kiến trúc package của dự án **FlyUp**.

---

**_Package descriptions_**

| No   | Package                 | Description                                                      |
| ---- | ----------------------- | ---------------------------------------------------------------- |
| _01_ | _Frontend / pages_      | _Chứa các trang giao diện chính của ứng dụng (React components)_ |
| _02_ | _Frontend / components_ | _Chứa các thành phần giao diện có thể tái sử dụng_               |
| _03_ | _Frontend / hooks_      | _Chứa các custom hooks xử lý logic và state của React_           |
| _04_ | _Frontend / services_   | _Chứa các hàm gọi API giao tiếp với Backend_                     |
| _05_ | _Frontend / contexts_   | _Chứa React Context để quản lý state toàn cục (Auth, Cart...)_   |
| _06_ | _Frontend / utils_      | _Chứa các hàm tiện ích hỗ trợ định dạng, xử lý dữ liệu_          |
| _07_ | _Backend / routers_     | _Định nghĩa các endpoint API và phân luồng request_              |
| _08_ | _Backend / middleware_  | _Chứa các hàm xử lý trung gian (xác thực, kiểm tra dữ liệu)_     |
| _09_ | _Backend / controllers_ | _Xử lý request từ client và trả về response tương ứng_           |
| _10_ | _Backend / services_    | _Chứa logic nghiệp vụ chính (business logic) của hệ thống_       |
| _11_ | _Backend / lib_         | _Chứa kết nối và thao tác với Database (Prisma), Queue, Cache_   |
| _12_ | _Backend / workers_     | _Xử lý các tác vụ nền không đồng bộ (như gửi email)_             |

---

## 📌 Quy ước ký hiệu

| Ký hiệu                 | Ý nghĩa                                                                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nét liền** (`→`)      | **Phụ thuộc chính (Primary Dependency)** — Đây là luồng xử lý cốt lõi mà folder này **bắt buộc phải gọi** đến folder kia để hoạt động. Nếu thiếu liên kết này, chức năng chính sẽ không chạy được. |
| **Nét đứt** (`-.->`)    | **Phụ thuộc phụ / Tiện ích (Secondary/Utility Dependency)** — Folder sử dụng một số hàm tiện ích hoặc cấu hình dùng chung. Đây là liên kết hỗ trợ, không nằm trong luồng xử lý nghiệp vụ chính.    |
| **Nét đậm kép** (`==>`) | **Giao tiếp giữa hai hệ thống (Cross-system Communication)** — Kết nối qua mạng HTTP giữa Frontend và Backend.                                                                                     |

---

## 🔵 FRONTEND (React/Vite)

### Phụ thuộc chính (Nét liền)

| Từ           | Đến            | Ý nghĩa                                                                                                                                                |
| ------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pages`      | → `components` | Mỗi trang (page) được lắp ghép từ nhiều component giao diện như Header, Footer, CourseCard, ReviewList...                                              |
| `pages`      | → `hooks`      | Các trang sử dụng custom hooks (`useAuth`, `useCart`) để lấy trạng thái đăng nhập, giỏ hàng.                                                           |
| `pages`      | → `services`   | Các trang gọi trực tiếp API thông qua thư mục services (`courseService`, `userService`, `checkoutService`...).                                         |
| `components` | → `hooks`      | Các component tái sử dụng cũng cần hooks. Ví dụ: `Header` dùng `useAuth` để hiển thị avatar, `CourseCard` dùng `useCart`.                              |
| `components` | → `services`   | Một số component gọi API trực tiếp. Ví dụ: `HeroSection` gọi `fetchCourses`, `ReviewForm` gọi `createCourseReview`, `ChatbotWidget` gọi `sendMessage`. |
| `hooks`      | → `contexts`   | Custom hooks là lớp truy cập vào React Context. Ví dụ: `useAuth` đọc từ `AuthContext`, `useCart` đọc từ `CartContext`.                                 |
| `contexts`   | → `services`   | Context providers gọi API để khởi tạo dữ liệu toàn cục. Ví dụ: `CartContext` gọi `fetchUserEnrollments` để kiểm tra khóa học đã mua.                   |

### Phụ thuộc phụ (Nét đứt)

| Từ           | Đến                | Ý nghĩa                                                                                                                                                                                                |
| ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pages`      | -.-> `Shared/Core` | Các trang sử dụng hàm tiện ích (`utils/imageUtils` để format URL ảnh, `utils/animations` cho hiệu ứng), hình ảnh mặc định (`assets/default-avatar.png`), cấu hình thanh toán (`config/paymentConfig`). |
| `components` | -.-> `Shared/Core` | Tương tự pages — component dùng `imageUtils`, `animations`, hình ảnh mặc định.                                                                                                                         |

> **Vì sao dùng nét đứt?** Vì `utils`, `constants`, `assets`, `config` là các module **hỗ trợ chung** — chúng không chứa logic nghiệp vụ mà chỉ cung cấp hàm tiện ích, hằng số, hoặc tài nguyên tĩnh. Bất kỳ folder nào cũng có thể sử dụng chúng mà không ảnh hưởng đến luồng xử lý chính.

---

## 🟢 BACKEND (Node.js/Express)

### Phụ thuộc chính (Nét liền)

| Từ            | Đến             | Ý nghĩa                                                                                                                                                                                                                                                              |
| ------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routers`     | → `middleware`  | Router gắn middleware vào route. Ví dụ: `authenticateJWT` kiểm tra token trước khi vào controller, `rateLimit` giới hạn số lần gọi, `validateSignup` kiểm tra dữ liệu đầu vào.                                                                                       |
| `routers`     | → `controllers` | Router chuyển request đến controller tương ứng. Ví dụ: route `/api/courses` gọi `courseController`, route `/api/auth` gọi `authController`.                                                                                                                          |
| `controllers` | → `services`    | Controller gọi service để xử lý logic nghiệp vụ. Ví dụ: `authController` gọi `authService` để đăng ký/đăng nhập, `courseController` gọi `courseService` để lấy danh sách khóa học.                                                                                   |
| `controllers` | → `lib`         | Một số controller truy cập trực tiếp database (Prisma) hoặc hàng đợi (Queue) mà không qua service. Ví dụ: `checkoutController` dùng `prisma` để tạo đơn hàng + `emailQueue` để gửi email xác nhận, `chatbotController` dùng `prisma` để lấy dữ liệu khóa học cho AI. |
| `services`    | → `lib`         | Service truy cập database thông qua Prisma và cache. Ví dụ: `courseService` dùng `prisma` + `cache`, `authService` dùng `prisma` để tạo/tìm user.                                                                                                                    |
| `workers`     | → `services`    | Worker tái sử dụng logic từ service. Ví dụ: `emailWorker` gọi `emailService` để gửi email thực tế khi nhận được job từ hàng đợi.                                                                                                                                     |
| `workers`     | → `lib`         | Worker lấy job từ hàng đợi (Queue). Ví dụ: `emailWorker` import `emailQueue` từ `lib/queue.js` để lắng nghe và xử lý các job gửi email.                                                                                                                              |

### Phụ thuộc phụ (Nét đứt)

| Từ           | Đến            | Ý nghĩa                                                                                                          |
| ------------ | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `routers`    | -.-> `lib`     | Chỉ 1 router (`users.js`) import trực tiếp `prisma` — đây là ngoại lệ, không phải luồng chuẩn, nên dùng nét đứt. |
| `middleware` | -.-> `utils`   | `authMiddleware` import `verifyAccessToken` từ `utils/jwtUtils.js` để giải mã JWT token.                         |
| `middleware` | -.-> `lib`     | `rateLimitMiddleware` import `cache` từ `lib/cache.js` để đếm số lần request của mỗi IP.                         |
| `services`   | -.-> `configs` | `authService` import `supabase` từ `configs/supabase.js` để xác thực qua Supabase Auth.                          |
| `services`   | -.-> `utils`   | `authService` import `verifyRefreshToken` từ `utils/jwtUtils.js` để làm mới access token.                        |

> **Vì sao dùng nét đứt?** Vì `utils` và `configs` đóng vai trò **cung cấp công cụ và cấu hình nền tảng**. Chúng không nằm trong chuỗi xử lý request chính (Router → Middleware → Controller → Service → Database) mà chỉ được gọi khi cần giải mã token, đọc biến môi trường, hoặc truy cập cache.

---

## 🔗 Kết nối giữa Frontend và Backend (Nét đậm kép)

| Từ            | Đến                  | Ý nghĩa                                                                                                                                                                                                                           |
| ------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE `services` | **==>** BE `routers` | Frontend giao tiếp với Backend thông qua **HTTP / REST API**. Thư mục `services` ở Frontend chứa các hàm gọi API (dùng `axios` hoặc `fetch`) để gửi request đến các endpoint được định nghĩa trong thư mục `routers` của Backend. |

> **Vì sao dùng nét đậm kép?** Đây là ranh giới giữa hai hệ thống hoàn toàn tách biệt (Frontend chạy trên trình duyệt, Backend chạy trên server). Giao tiếp diễn ra qua mạng HTTP, khác biệt hoàn toàn so với các import module nội bộ trong cùng một hệ thống.

---

## 🎨 Ý nghĩa màu sắc

| Màu                  | Ý nghĩa                                                           |
| -------------------- | ----------------------------------------------------------------- |
| 🔵 **Xanh dương**    | Các folder thuộc Frontend (React)                                 |
| 🟢 **Xanh lá**       | Các folder thuộc Backend (Express)                                |
| 🟠 **Cam**           | Tầng dữ liệu — `lib` chứa Prisma (Database), Queue, Cache         |
| ⬜ **Xám, viền đứt** | Thư mục dùng chung / tiện ích (utils, configs, constants, assets) |
