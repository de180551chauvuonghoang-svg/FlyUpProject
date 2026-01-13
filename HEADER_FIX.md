# Hướng Dẫn Sửa Lỗi "Nháy" Header (Header Flicker)

Tài liệu này giải thích cách khắc phục lỗi hiển thị nút Login/Signup trong khoảnh khắc ngắn khi trang vừa tải lại, mặc dù người dùng đã đăng nhập.

## Vấn Đề
Trước đây, component `Header` chỉ kiểm tra biến `user`. Khi trang web mới tải (reload), request lấy thông tin user tốn một khoảng thời gian ngắn (asynchronous). Trong thời gian đó, `user` là `null`, nên giao diện tự động hiển thị nút "Log In" / "Sign Up". Khi request hoàn tất và `user` có dữ liệu, giao diện mới "nhảy" sang hiển thị thông tin người dùng.

## Kỹ Thuật Sử Dụng
Chúng ta sử dụng kỹ thuật **Conditional Rendering (Render có điều kiện)** kết hợp với **Loading State (Trạng thái đang tải)**.

Thay vì chỉ có 2 trạng thái (Đã đăng nhập / Chưa đăng nhập), chúng ta thêm trạng thái thứ 3: **Đang kiểm tra (Loading)**.

## So Sánh Code (Diff)

### Code Cũ (Gây lỗi)
Chỉ kiểm tra `user`. Nếu chưa có user (kể cả do đang load), hiển thị Login.

```javascript
// Header.jsx
const { user, signOut } = useAuth(); // Không lấy loading

// ...

{user ? (
  // Hiển thị Dropdown User
  <div className="user-dropdown">...</div>
) : (
  // Hiển thị nút Login/Register ngay lập tức nếu user là null
  <div className="auth-buttons">
    <Link to="/login">Log In</Link>
    <Link to="/register">Sign Up</Link>
  </div>
)}
```

### Code Mới (Đã sửa)
Thêm kiểm tra `loading`. Nếu đang load, hiển thị khung chờ (Skeleton) hoặc ẩn đi, tránh hiện sai nút.

```javascript
// Header.jsx
const { user, loading, signOut } = useAuth(); // Lấy thêm biến loading

// ...

{loading ? (
  // 1. TRẠNG THÁI LOADING: Hiển thị Skeleton (khung hình chờ)
  // Giúp người dùng biết dữ liệu đang được tải, tránh giật giao diện
  <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>
      <div className="hidden sm:block w-24 h-4 bg-white/10 rounded animate-pulse"></div>
  </div>
) : user ? (
  // 2. TRẠNG THÁI ĐÃ LOGIN: Hiển thị Dropdown User như cũ
  <div className="user-dropdown">...</div>
) : (
  // 3. TRẠNG THÁI CHƯA LOGIN: Chỉ hiển thị khi chắc chắn loading = false và user = null
  <div className="auth-buttons">
    <Link to="/login">Log In</Link>
    <Link to="/register">Sign Up</Link>
  </div>
)}
```

## Tóm Tắt
Bằng việc thêm `loading` state, trình duyệt sẽ "chờ" cho đến khi xác định chính xác trạng thái đăng nhập của người dùng mới quyết định hiển thị nút Login hay Avatar, từ đó loại bỏ hoàn toàn hiện tượng nhấp nháy giao diện.
