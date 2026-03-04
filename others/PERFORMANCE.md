# 🚀 FlyUp Project - Performance Optimization Documentation

Tài liệu này tổng hợp các kỹ thuật tối ưu hóa hiệu năng (Performance Optimization) kèm theo **Code thực tế** trong dự án.

---

## 1. Backend Optimizations (Tối ưu phía Server)

### 🏎️ Cache Warming (Làm nóng Cache)
**Mục đích:** Tránh để người dùng đầu tiên phải chờ đợi kết nối Database. Server tự động nạp dữ liệu vào RAM ngay khi khởi động.

**Code:** `backend/src/index.js`
```javascript
// Warm up cache
(async () => {
  try {
    console.log('🔥 Warming up cache...');
    // Chạy tuần tự để tránh nghẽn Connection Pool của Database
    await getCategories();
    await getCourses({ page: 1, limit: 12 });
    console.log('✅ Cache warmed up successfully!');
  } catch (error) {
    console.warn('⚠️ Cache warmup partial failure (non-critical):', error.message);
  }
})();
```

### 💾 Server-Side Caching (In-Memory)
**Mục đích:** Lưu kết quả query vào RAM server để trả về tức thì cho các request sau đó, giảm tải cho Database.

**Code:** `backend/src/services/courseService.js`
```javascript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300 }); // Cache sống trong 5 phút

export const getCourseById = async (courseId) => {
    // 1. Kiểm tra xem có trong Cache chưa?
    const cacheKey = `course_${courseId}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
       console.log('[courseService] Serving course from cache:', courseId);
       return cachedResult; // -> Trả về NGAY LẬP TỨC
    }
    
    // 2. Nếu chưa có, mới gọi Database
    const course = await prisma.courses.findFirst({ ... });

    // 3. Có kết quả thì lưu vào Cache
    cache.set(cacheKey, course);
    return course;
};
```

---

## 2. Frontend Optimizations (Tối ưu phía Client)

### 🔮 Aggressive Prefetching (Tải trước dữ liệu)

#### A. Initial Load Prefetch (Tải ngay khi vào App)
**Mục đích:** Tải sẵn danh sách khóa học ngay khi người dùng vào trang chủ, để khi họ bấm sang trang "Courses" là có ngay.

**Code:** `frontend/src/components/Header/Header.jsx`
```javascript
  const handlePrefetchCourses = () => {
    // Tải ngầm danh sách khóa học trang 1
    queryClient.prefetchQuery({
      queryKey: ['courses', { page: '1', limit: '8' }],
      queryFn: () => fetchCourses({ page: '1', limit: '8' }),
      staleTime: 1000 * 60 * 5, // Dữ liệu coi là "mới" trong 5 phút
    });
  };

  // Kích hoạt ngay khi Component được mount (vừa vào web)
  useEffect(() => {
    handlePrefetchCourses();
  }, []);
```

#### B. Bulk Details Prefetch (Tải trước chi tiết hàng loạt)
**Mục đích:** Ngay khi danh sách khóa học hiện ra, tải ngầm luôn chi tiết của TẤT CẢ khóa học đó. Giúp việc xem chi tiết diễn ra tức thì.

**Code:** `frontend/src/pages/CoursesPage.jsx`
```javascript
    // --- Bulk Prefetching for Visible Courses ---
    useEffect(() => {
        if (courses.length > 0) {
            // Duyệt qua từng khóa học đang hiển thị
            courses.forEach(course => {
                // Tải trước chi tiết (Details) của nó
                queryClient.prefetchQuery({
                    queryKey: ['course', course.id],
                    queryFn: () => fetchCourseById(course.id),
                    staleTime: 1000 * 60 * 5,
                });
            });
        }
    }, [courses, queryClient]);
```

#### C. Predictive Pagination Prefetch (Dự đoán trang sau)
**Mục đích:** Khi người dùng đang xem trang N, tự động tải trước trang N+1.

**Code:** `frontend/src/pages/CoursesPage.jsx`
```javascript
    useEffect(() => {
        // Nếu chưa phải trang cuối
        if (coursesData?.pagination && pagination.page < pagination.totalPages) {
            const nextPage = pagination.page + 1;
            // ... Tạo params cho trang sau ...
            
            // Tải ngầm trang tiếp theo
            queryClient.prefetchQuery({
                queryKey: ['courses', nextPageParams],
                queryFn: () => fetchCourses(nextPageParams),
                staleTime: 1000 * 60 * 5,
            });
        }
    }, [coursesData, pagination.page, ...]);
```

### 🔄 React Query Configuration
**Mục đích:** Cấu hình để tối ưu trải nghiệm người dùng, tránh loading lại khi không cần thiết.

**Code:** `frontend/src/pages/CoursesPage.jsx`
```javascript
const { data: coursesData } = useQuery({
    queryKey: ['courses', fetchCoursesParams],
    queryFn: () => fetchCourses(fetchCoursesParams),
    
    // Giữ lại dữ liệu cũ trên màn hình trong lúc tải dữ liệu mới 
    // -> Tránh màn hình trắng xóa hoặc giật cục
    placeholderData: keepPreviousData, 
    
    // Trong 5 phút, nếu gọi lại query này thì dùng luôn cache, không gọi server
    staleTime: 1000 * 60 * 5, 
});
```

---

## 🛠️ Tổng kết
| Kỹ thuật | File áp dụng | Tác dụng rõ nhất |
| :--- | :--- | :--- |
| **Cache Warming** | `backend/src/index.js` | Tăng tốc lần truy cập đầu tiên sau khi start server |
| **Server-Side Cache** | `courseService.js` | Giảm tải DB, phản hồi API siêu tốc (<10ms) |
| **Initial Prefetch** | `Header.jsx` | Vào trang "Courses" tức thì |
| **Bulk Details Prefetch** | `CoursesPage.jsx` | Xem chi tiết khóa học tức thì (0 độ trễ) |
| **Pagination Prefetch** | `CoursesPage.jsx` | Chuyển trang không cần chờ |
