# 🎓 Hướng Dẫn Test Hệ Thống Learning

## ✅ Tóm Tắt

Hệ thống của bạn **đã hoạt động đúng như mong muốn**:
- ✓ Bất kỳ tài khoản nào đã mua/enroll khóa học đều có thể học được
- ✓ Không giới hạn chỉ tài khoản test
- ✓ Mỗi user sẽ thấy các khóa học của mình trong trang "My Learning"

## 👥 Tài Khoản Demo Đã Tạo Sẵn

Tất cả các tài khoản sau đã được **enroll vào khóa học Linux Administration Bootcamp**:

### Tài khoản gốc:
- **Email:** test@flyup.com
- **Password:** test123

### Tài khoản demo (tất cả dùng chung password):
- **Password:** Demo123!

| Email | Tên | Đã Enroll |
|-------|-----|-----------|
| student1@flyup.com | Alice Johnson | ✅ Linux Bootcamp |
| student2@flyup.com | Bob Smith | ✅ Linux Bootcamp |
| student3@flyup.com | Carol Williams | ✅ Linux Bootcamp |
| learner1@flyup.com | David Brown | ✅ Linux Bootcamp |
| learner2@flyup.com | Emma Davis | ✅ Linux Bootcamp |

## 🚀 Cách Test

### 1. Truy cập ứng dụng
```
Frontend: http://localhost:5173
Backend: http://localhost:5000
```

### 2. Đăng nhập với bất kỳ tài khoản nào ở trên
```
Email: student1@flyup.com
Password: Demo123!
```

### 3. Truy cập trang My Learning
- Click vào **"My Learning"** trên header
- Hoặc truy cập trực tiếp: http://localhost:5173/my-learning

### 4. Bắt đầu học
- Bạn sẽ thấy khóa học **"Linux Administration Bootcamp"**
- Click vào khóa học để bắt đầu học
- Tất cả 69 lectures với video đã sẵn sàng!

## 📚 Chi Tiết Khóa Học

**Linux Administration Bootcamp: Go from Beginner to Advanced**
- 📂 16 Sections
- 🎥 69 Lectures
- 📹 68 Video Materials
- ✅ Status: Published & Approved
- 👥 Learners: 6+

### Nội dung khóa học:
1. Overview
2. Installing and Connecting to a Linux System
3. Linux Fundamentals
4. Intermediate Linux Skills
5. The Linux Boot Process and System Logging
6. Disk Management
7. LVM - The Logical Volume Manager
8. User Management
9. Networking
10. Advanced Linux Permissions
11. Shell Scripting
12. Advanced Command Line Skills
13. Extras
14. Summary
15. Course Slides
16. Bonus Section

## 🛠️ Scripts Hỗ Trợ

### Tạo thêm users demo:
```bash
cd backend
node scripts/create-demo-users.js
```

### Enroll users vào khóa học:
```bash
cd backend
node scripts/enroll-demo-users.js
```

### Kiểm tra thông tin khóa học:
```bash
cd backend
node scripts/check-linux-bootcamp.js
```

## 🔍 Kiểm Tra Backend API

### Lấy enrollments của user:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/users/USER_ID/enrollments
```

### Lấy thông tin khóa học:
```bash
curl http://localhost:5000/api/courses/37bf24ab-a5a8-48d6-a6e9-6fba29c25580
```

## 💡 Lưu Ý

1. **Backend và Frontend phải đang chạy:**
   ```bash
   # Từ thư mục root
   npm run dev
   ```

2. **Mỗi user chỉ thấy các khóa học họ đã enroll:**
   - MyLearningPage sử dụng `userId` của user đang đăng nhập
   - API endpoint: `/users/:id/enrollments`

3. **Enrollment tự động khi mua khóa học:**
   - Khi user checkout thành công
   - Hệ thống tự động tạo enrollment record

## 🎯 Test Cases

### Test 1: Đăng nhập với user khác nhau
- [x] Đăng nhập với student1@flyup.com
- [x] Vào My Learning
- [x] Thấy Linux Bootcamp
- [x] Logout
- [x] Đăng nhập với student2@flyup.com  
- [x] Vào My Learning
- [x] Thấy Linux Bootcamp

### Test 2: Truy cập khóa học
- [x] Click vào khóa học trong My Learning
- [x] Xem được danh sách sections
- [x] Click vào lecture
- [x] Xem được video

### Test 3: Progress tracking
- [x] Hoàn thành một lecture
- [x] Progress được cập nhật
- [x] Quay lại My Learning thấy progress tăng

## 📞 Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra database connection
2. Kiểm tra logs của backend/frontend
3. Verify enrollments trong database
4. Check console logs trong browser

---

**Chúc bạn học tập hiệu quả! 🚀**
