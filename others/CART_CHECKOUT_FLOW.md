# Quy Trình Cart & Checkout (Chi Tiết Kỹ Thuật)

Tài liệu này mô tả chi tiết luồng hoạt động của chức năng Giỏ hàng và Thanh toán trong dự án, bao gồm cả tính năng lựa chọn ngân hàng (MB Bank / BIDV) mới được cập nhật.

## 1. Tổng Quan Luồng Dữ Liệu

1.  **Giỏ hàng (Cart):** Người dùng thêm khóa học. Dữ liệu được lưu trong `localStorage` thông qua `CartContext`.
2.  **Khởi tạo Thanh toán (Checkout Init):** Khi nhấn "Checkout", frontend gọi API để tạo phiên giao dịch (`checkoutId`).
3.  **Trang Checkout:**
    *   Hiển thị thông tin đơn hàng.
    *   Tạo mã QR thanh toán động (VietQR).
    *   Polling (liên tục kiểm tra) trạng thái đơn hàng mỗi 3 giây.
4.  **Thanh toán:** Người dùng quét QR -> Chuyển khoản -> Server nhận Webhook -> Server cập nhật trạng thái đơn hàng -> Frontend nhận được trạng thái SUCCESS và điều hướng.

## 2. Các Thành Phần Chính

### 2.1. CartContext (`frontend/src/contexts/CartContext.jsx`)
*   **Vai trò:** Quản lý trạng thái giỏ hàng toàn cục.
*   **Cơ chế:** Lưu danh sách `cartItems` vào `localStorage`.
*   **Hàm quan trọng:** `addToCart`, `removeFromCart`, `clearCart`.

### 2.2. Trang Checkout (`frontend/src/pages/CheckoutPage.jsx`)
Đây là nơi xử lý logic phức tạp nhất.

#### A. Khởi tạo & Trạng thái
Sử dụng `useEffect` để tải thông tin đơn hàng khi trang vừa load:
```javascript
// Lấy thông tin checkout từ API dựa trên checkoutId trên URL
const res = await getCheckoutStatus(checkoutId);
setCheckout(res.data);
```

#### B. Cơ Chế Polling (Real-time update)
Frontend không sử dụng WebSocket mà dùng kỹ thuật **Short Polling** để kiểm tra thanh toán:
```javascript
useEffect(() => {
    // Chạy mỗi 3 giây
    const interval = setInterval(async () => {
        const res = await getCheckoutStatus(checkoutId);
        // Nếu trạng thái thay đổi (PENDING -> COMPLETED), cập nhật giao diện
        if (res.data.status !== checkout.status) {
             setCheckout(res.data);
        }
    }, 3000);
    // ... cleanup
}, ...);
```

#### C. Lựa Chọn Ngân Hàng (Mới Cập Nhật)
Hệ thống cho phép người dùng chọn ngân hàng để chuyển khoản. State `selectedBank` lưu ngân hàng hiện tại.

```javascript
// Cấu hình (config/paymentConfig.js)
const BANKS = [
    { id: 'MB', name: 'MB Bank', accountNo: '...' },
    { id: 'BIDV', name: 'BIDV', accountNo: '...' }
];

// State
const [selectedBank, setSelectedBank] = useState(BANKS[0]); // Mặc định là MB

// Render Button Chọn
{BANKS.map(bank => (
    <button onClick={() => setSelectedBank(bank)}>
        {bank.shortName}
    </button>
))}
```

#### D. Tạo Mã QR Động (Dynamic VietQR)
URL ảnh QR được tạo tự động dựa trên ngân hàng đang chọn và giá tiền:
```javascript
// URL tự động thay đổi khi selectedBank thay đổi
const qrUrl = `https://img.vietqr.io/image/${selectedBank.id}-${selectedBank.accountNo}-compact2.png?amount=...`;
```
Khi người dùng bấm chọn BIDV, `selectedBank` đổi -> `qrUrl` đổi -> Ảnh QR trên màn hình tự động cập nhật sang mã QR của BIDV.

## 3. Cấu Hình Thanh Toán (`frontend/src/config/paymentConfig.js`)
File này chứa thông tin tài khoản ngân hàng. Hiện tại đang hỗ trợ:
1.  **MB Bank**: 0763593290
2.  **BIDV**: 5660465542

Để thêm ngân hàng mới, chỉ cần thêm object vào mảng `BANKS` trong file này.

## 4. Xử Lý Sau Thanh Toán
Khi `checkout.status` chuyển sang `COMPLETED`:
1.  Hiển thị thông báo thành công (Toast).
2.  Xóa giỏ hàng: `clearCart()`.
3.  Tự động chuyển hướng sang trang "My Learning" sau 3 giây.
