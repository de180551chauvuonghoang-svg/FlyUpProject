# Tài liệu Tính năng Chia sẻ Website (Share Feature)

Tài liệu này giải thích chi tiết về mặt kỹ thuật và logic hoạt động của tính năng chia sẻ website, bao gồm cả code đã được tối ưu hóa.

## 1. Cấu Trúc Tổng Quan

Tính năng được xây dựng dựa trên 2 thành phần chính:
1.  **`Header.jsx`**: Nơi người dùng bắt đầu tương tác (nút "Share").
2.  **`ShareModal.jsx`**: Component hiển thị Popup chứa mã QR và nút sao chép link.

---

## 2. Chi Tiết Thực Hiện & Giải Thích Code

### A. Tích hợp vào Header (`Header.jsx`)
Tại đây, chúng ta thêm một nút bấm vào thanh điều hướng. Khi bấm vào, một state sẽ được bật lên để mở Modal.

**Logic chính:**
1.  Khai báo state `isShareModalOpen`.
2.  Thêm nút bấm có icon `Share2`.
3.  Nhúng component `<ShareModal />` vào cuối file (để nó tách biệt khỏi logic layout chính).

**Code Snippet:**
```javascript
import { Share2 } from 'lucide-react';
import ShareModal from '../ShareModal';

const Header = () => {
  // 1. State quản lý đóng/mở Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <header>
      {/* ... code cũ ... */}
      
      {/* 2. Nút kích hoạt Share Modal */}
      <button
        onClick={() => setIsShareModalOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#16161e]..."
        title="Share this page"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {/* 3. Component Modal nhận vào state và hàm đóng */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </header>
  );
};
```

---

### B. Logic Modal Chia Sẻ (`ShareModal.jsx`)
Đây là phần quan trọng nhất, xử lý hiển thị QR Code và Copy Link.

#### 1. QR Code
Sử dụng thư viện `qrcode.react` để tự động tạo mã từ URL hiện tại.
```javascript
const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

// Render QR Code
<QRCodeSVG
  value={currentUrl} // Giá trị link cần mã hóa
  size={200}
  level="H"          // Mức độ sửa lỗi cao nhất (High)
/>
```

#### 2. Xử lý Copy Link (Best Practice)
Đoạn code copy này đã được tối ưu để tránh lỗi memory leak khi người dùng đóng modal quá nhanh hoặc bấm nhiều lần.

*   **`useRef`**: Dùng để lưu trữ ID của `setTimeout`. Khác với biến thường, giá trị trong `useRef` giữ nguyên qua các lần render nhưng thay đổi nó không gây re-render.
*   **`useEffect`**: Dùng để dọn dẹp (cleanup) khi component bị hủy (unmount).

```javascript
/* === Logic Xử Lý Copy An Toàn === */
export default function ShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null); // Lưu tham chiếu timer

  // Cleanup: Xóa timer nếu người dùng đóng modal trước khi hết 2 giây
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      // 1. Copy vào Clipboard
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      
      // 2. Xóa timer cũ (nếu có) để tránh xung đột
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      // 3. Tạo timer mới để reset nút về trạng thái ban đầu sau 2s
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
```

#### 3. Animation Out (Hiệu ứng khi đóng)
Để modal có hiệu ứng mờ dần khi tắt (Exit Animation), chúng ta phải giữ `AnimatePresence` luôn render, và chỉ ẩn hiện nội dung bên trong nó.

```javascript
/* === Logic Animation === */
return createPortal(
  <AnimatePresence>
    {/* Kiểm tra isOpen BÊN TRONG AnimatePresence */}
    {isOpen && (
      <Motion.div
        initial={{ opacity: 0 }}    // Bắt đầu: Trong suốt
        animate={{ opacity: 1 }}    // Hiện: Rõ nét
        exit={{ opacity: 0 }}       // Tắt: Mờ dần đi (Quan trọng)
        className="fixed inset-0..."
      >
        {/* Nội dung Modal */}
      </Motion.div>
    )}
  </AnimatePresence>,
  document.body
);
```

## 3. Tổng Kết Các Kỹ Thuật Sử Dụng

1.  **React Portal**: Giúp Modal hiển thị đè lên trên tất cả giao diện (`z-index` không bị ảnh hưởng bởi component cha).
2.  **Framer Motion**: Tạo trải nghiệm người dùng mượt mà với hiệu ứng xuất hiện và biến mất.
3.  **Clean Code / Memory Leak Prevention**: Sử dụng `useRef` và cleanup function trong `useEffect` để đảm bảo không gọi `setState` trên component đã bị hủy.
4.  **Client-Side URL**: Sử dụng `window.location.href` để tự động lấy link chính xác ở mọi môi trường (Dev, Vercel, Production).
