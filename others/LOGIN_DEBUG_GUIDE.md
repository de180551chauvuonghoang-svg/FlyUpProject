# 🔧 Debugging Login Issue

## Vấn đề

Người dùng không thể login vào hệ thống.

## ✅ Kiểm tra Backend

Backend login API **hoạt động đúng**:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"logintest@example.com","password":"Password123!"}'
```

Response:

```json
{
  "message": "Login successful",
  "user": {
    "id": "5a63f247-7948-48c3-9c0f-069b9a511d18",
    "email": "logintest@example.com",
    "fullName": "Login Test User",
    "role": "learner"
  },
  "session": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "tokenType": "Bearer",
    "expiresIn": 1800
  }
}
```

## 📝 Test Credentials

Email: `logintest@example.com`
Password: `Password123!`

## 🔍 Cách Debug Login

### 1. Check Browser Console (F12)

- Mở DevTools (F12)
- Vào tab Console
- Tìm message "[CourseLessonPage]" hoặc lỗi login
- Tìm NetworkTab để xem request/response

### 2. Check Networking Tab

- Vào tab Network
- Bấm nút Login
- Tìm request tới `/api/auth/login`
- Check Status Code (200 = success, 401 = invalid credentials, 500 = server error)
- Check Response body

### 3. Các lỗi thường gặp:

- **"Invalid credentials"** → Password sai
- **"Failed to fetch"** → Backend không running hoặc CORS error
- **401 Unauthorized** → Token không hợp lệ
- **Network Error** → Kiểm tra kết nối, API URL

## 🚀 Next Steps

Hãy:

1. Mở F12 DevTools
2. Vào tab Console
3. Vào LoginPage và nhập:
   - Email: `logintest@example.com`
   - Password: `Password123!`
4. Nhấn Login
5. Chụp screenshot error từ Console hoặc Network tab
6. Gửi screenshot để tôi debug

---

## 📋 Checklist

- [x] Backend API hoạt động ✅
- [x] Database có users ✅
- [x] Test user tạo thành công ✅
- [ ] Frontend login page hoạt động? → Cần check

---

**Để debug thêm, hãy share screenshot lỗi từ browser console! 📸**
