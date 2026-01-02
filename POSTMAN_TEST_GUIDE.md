# 🧪 Hướng Dẫn Test JWT với Postman

## 📥 Cách 1: Import Postman Collection (Nhanh nhất)

### Bước 1: Import Collection
1. Mở Postman
2. Click **Import** ở góc trái trên
3. Chọn file `FlyUp_JWT_Tests.postman_collection.json`
4. Click **Import**

### Bước 2: Tạo Environment
1. Click vào **Environments** (biểu tượng ⚙️ ở sidebar)
2. Click **Create Environment**
3. Đặt tên: `FlyUp Development`
4. Thêm các variables:
   - `baseUrl`: `http://localhost:5000`
   - `accessToken`: (để trống, sẽ tự động fill)
   - `refreshToken`: (để trống, sẽ tự động fill)
   - `userId`: (để trống, sẽ tự động fill)
5. Click **Save**
6. Chọn environment vừa tạo ở dropdown góc phải trên

### Bước 3: Run Tests Theo Thứ Tự
Chạy các requests theo thứ tự 1→6:

---

## 🔢 Cách 2: Test Từng Endpoint Thủ Công

### ✅ Test 1: **Register User** (Đăng ký)

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/register`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "testjwt@example.com",
    "password": "Test123!",
    "fullName": "JWT Test User",
    "role": "learner"
  }
  ```

**Expected Response (201 Created):**
```json
{
  "message": "Account created successfully!",
  "user": {
    "id": "uuid-here",
    "email": "testjwt@example.com",
    "fullName": "JWT Test User",
    "role": "learner",
    "username": "testjwt123"
  },
  "session": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 1800
  }
}
```

**✏️ Action**: Copy `accessToken` và `refreshToken` từ response!

---

### ✅ Test 2: **Login User** (Đăng nhập)

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/login`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "testjwt@example.com",
    "password": "Test123!"
  }
  ```

**Expected Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "testjwt@example.com",
    "fullName": "JWT Test User",
    "role": "learner"
  },
  "session": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 1800
  }
}
```

---

### ✅ Test 3: **Get Current User** (Protected Route)

**Request:**
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/auth/me`
- **Headers**:
  ```
  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
  ```
  ⚠️ **Quan trọng**: Thay `YOUR_ACCESS_TOKEN_HERE` bằng `accessToken` từ Test 1 hoặc 2!

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "testjwt@example.com",
    "fullName": "JWT Test User",
    "role": "learner",
    "avatarUrl": "",
    "createdAt": "2025-12-26T04:44:00.000Z"
  }
}
```

**Expected Error (401 Unauthorized) nếu token sai:**
```json
{
  "error": "Invalid token",
  "message": "The provided token is invalid",
  "code": "TOKEN_INVALID"
}
```

---

### ✅ Test 4: **Refresh Token**

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/refresh`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }
  ```
  ⚠️ **Quan trọng**: Thay `YOUR_REFRESH_TOKEN_HERE` bằng `refreshToken` từ Test 1 hoặc 2!

**Expected Response (200 OK):**
```json
{
  "message": "Token refreshed successfully",
  "session": {
    "accessToken": "NEW_ACCESS_TOKEN...",
    "refreshToken": "NEW_REFRESH_TOKEN...",
    "tokenType": "Bearer",
    "expiresIn": 1800
  }
}
```

**💡 Lưu ý**: Cả access token VÀ refresh token đều được rotate (đổi mới)!

---

### ✅ Test 5: **Test Invalid Token**

**Request:**
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/auth/me`
- **Headers**:
  ```
  Authorization: Bearer invalid_token_here
  ```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Invalid token",
  "message": "The provided token is invalid",
  "code": "TOKEN_INVALID"
}
```

---

### ✅ Test 6: **Test Without Token**

**Request:**
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/auth/me`
- **Headers**: (không có Authorization header)

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Authentication required",
  "message": "No authorization header provided"
}
```

---

## 🎯 Checklist Test Scenarios

Đánh dấu ✅ khi test xong:

- [ ] **Registration**: Tạo user mới thành công, nhận được JWT tokens
- [ ] **Login**: Đăng nhập thành công với credentials đúng
- [ ] **Login Failed**: Đăng nhập thất bại với password sai (401)
- [ ] **Protected Route**: Truy cập `/me` với valid token thành công
- [ ] **Invalid Token**: Truy cập `/me` với invalid token bị reject (401)
- [ ] **No Token**: Truy cập `/me` không có token bị reject (401)
- [ ] **Token Refresh**: Refresh token thành công, nhận được tokens mới
- [ ] **Invalid Refresh**: Refresh với invalid token bị reject (401)
- [ ] **Token in Response**: Verify JWT structure tại [jwt.io](https://jwt.io)

---

## 🔍 Verify JWT Token

### Cách kiểm tra JWT structure:

1. Copy `accessToken` từ response
2. Vào https://jwt.io
3. Paste token vào ô **Encoded**
4. Xem **Decoded** section:

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "userId": "uuid-here",
  "email": "testjwt@example.com",
  "role": "learner",
  "type": "access",
  "iat": 1735189200,
  "exp": 1735191000,
  "iss": "flyup-edutech",
  "aud": "flyup-users"
}
```

**Verify:**
- ✅ `exp` (expiration) = `iat` + 1800 seconds (30 minutes)
- ✅ `type` = "access" (hoặc "refresh" cho refresh token)
- ✅ Contains `userId`, `email`, `role`

---

## 🐛 Troubleshooting

### Lỗi: Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```
**Giải pháp**: Backend chưa chạy
```bash
cd backend
npm run dev
```

### Lỗi: 401 Unauthorized
**Nguyên nhân**: Token sai, expired, hoặc không có token
**Giải pháp**:
1. Check Authorization header format: `Bearer <token>`
2. Đảm bảo copy đúng token (không có khoảng trắng)
3. Login lại để lấy token mới

### Lỗi: 500 Internal Server Error
**Nguyên nhân**: Backend có lỗi
**Giải pháp**:
1. Check terminal backend để xem error log
2. Verify JWT_SECRET và JWT_REFRESH_SECRET trong `.env`
3. Restart backend server

---

## 📊 Expected Test Results Summary

| Test | Expected Status | Expected Response |
|------|----------------|-------------------|
| Register | 201 Created | User + JWT tokens |
| Login | 200 OK | User + JWT tokens |
| Get User (valid token) | 200 OK | User data |
| Get User (no token) | 401 Unauthorized | Error message |
| Get User (invalid token) | 401 Unauthorized | Error message |
| Refresh Token | 200 OK | New tokens |
| Invalid Refresh | 401 Unauthorized | Error message |

---

## 🎉 Success Criteria

✅ **JWT Implementation hoàn hảo khi:**
1. Register/Login trả về JWT tokens trong format đúng
2. Protected routes yêu cầu valid JWT
3. Invalid/expired tokens bị reject với error rõ ràng
4. Refresh token flow hoạt động và rotate tokens
5. JWT payload chứa đầy đủ thông tin user

---

Chúc bạn test thành công! 🚀
