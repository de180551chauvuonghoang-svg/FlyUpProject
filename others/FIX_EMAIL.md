# Hướng dẫn Fix lỗi gửi Email (Invalid Grant) triệt để

Lỗi `invalid_grant` thường xảy ra do:
1. **Refresh Token bị hết hạn**: Nếu App trên Google Cloud đang ở trạng thái **Testing**, token sẽ hết hạn sau **7 ngày**.
2. **Token bị thu hồi**: Do đổi mật khẩu mail hoặc thu hồi quyền truy cập.

Để khắc phục, bạn cần tạo lại **Refresh Token** mới. Cách **ổn định nhất** là dùng **Google OAuth Playground**.

## Bước 1: Chuẩn bị & Cấu hình Redirect URI
1. Mở file `backend/.env` và copy 2 giá trị: `GMAIL_CLIENT_ID` và `GMAIL_CLIENT_SECRET`.
2. Truy cập [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
3. Tìm **OAuth 2.0 Client IDs** -> Chọn Client ID bạn đang dùng.
4. Ở phần **Authorized redirect URIs**, nhấn **ADD URI** và thêm link này vào:
   `https://developers.google.com/oauthplayground`
5. Nhấn **SAVE**.

## Bước 2: Tạo Token mới
1. Truy cập: [https://developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
2. Nhấn vào biểu tượng **bánh răng** (⚙️) ở góc phải trên cùng.
    - Tích chọn **Use your own OAuth credentials**.
    - Paste `OAuth Client ID` và `OAuth Client Secret` của bạn vào.
    - Nhấn **Close**.
3. Ở khung bên trái **Step 1**:
    - Tìm và chọn **Gmail API v1**.
    - Chọn scope: `https://mail.google.com/` (hoặc `https://www.googleapis.com/auth/gmail.send`).
    - Nhấn nút **Authorize APIs**.
4. Đăng nhập bằng tài khoản Gmail của bạn (tài khoản config trong code).
    - Nếu hiện cảnh báo "Google hasn't verified this app", bấm **Advanced** -> **Go to ... (unsafe)** -> **Continue**.
5. Sau khi chuyển hướng về lại Playground (**Step 2**):
    - Nhấn nút **Exchange authorization code for tokens**.
6. Copy đoạn mã ở ô **Refresh Token** (dòng dưới cùng).

## Bước 3: Cập nhật Server
1. Mở file `backend/.env`.
2. Thay thế giá trị `GMAIL_REFRESH_TOKEN` bằng mã mới vừa copy.
3. **Restart lại Server** (Ctrl + C rồi chạy lại `npm run dev`).

## Lưu ý quan trọng ("Triệt để")
- Nếu App của bạn trên Google Cloud Console vẫn đang là **Testing**, token sẽ lại hết hạn sau 7 ngày.
- Để dùng vĩnh viễn, bạn cần vào [Google Cloud Console](https://console.cloud.google.com/) -> **OAuth consent screen** -> Bấm **PUBLISH APP** (Chuyển sang Production).
    - *Lưu ý: App Production có thể cần Google duyệt, nhưng nếu chỉ dùng cho chính email owner thì thường vẫn ổn.*
