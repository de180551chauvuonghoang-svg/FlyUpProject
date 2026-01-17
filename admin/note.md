1. Init project admin: npm create vite@latest <project_name>
2. Install tailwindcss, framer motion, lucide react, react-router-dom, react-hot-toast...
3. Set up cấu trúc dự án
- Assets: chứa hình ảnh, styles, audio....
- Components: chứa các thành phần tái sử dụng
- Pages: các trang con
- Hooks: các hàm tiêu chuẩn react, use+<>
- Services: các hàm call API giao tiếp với backend
- Utils: các hàm tiện ích dùng chung cho toàn hệ thống
- Routes: định tuyến mỗi link ứng với một trang cụ thể nào đó
- Contexts: quản lý states tạm thời cho toàn hệ thống
4. Admin
- MVC => Model, View, Controller, DAO (Server-side)
- Backend 

=> Router => Controller => Service => Model
=> /api/v1/users => controller => service => model
=> /api/v1/courses
=> /api/v1/orders
...
