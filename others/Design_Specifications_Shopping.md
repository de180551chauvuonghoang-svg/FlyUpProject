# III. Design Specifications

## 3. Shopping, Payment & Transactions

### 3.1 Shopping Cart

**a. Cart Page**

_Màn hình hiển thị danh sách các khóa học đã được thêm vào giỏ hàng. Cho phép người dùng kiểm tra lại thông tin, loại bỏ các mục không cần thiết, hoặc tiếp tục thanh toán._

#### UI Design

_Giao diện bao gồm danh sách các mặt hàng bên trái và bảng tóm tắt đơn hàng bên phải._

**<<Mockup prototype>>** _(Cart Page Image)_

| Field Name           | Field Type | Description                                                                             |
| :------------------- | :--------- | :-------------------------------------------------------------------------------------- |
| **Cart Items List**  |            |                                                                                         |
| `Remove All`         | `Button`   | Xóa tất cả khóa học khỏi giỏ hàng.                                                      |
| `Course Card (Cart)` | `Card`     | Thông tin khóa học trong giỏ (Thumbnail, Title, Author, Rating, Lectures count, Price). |
| `Remove`             | `Button`   | Xóa khóa học cụ thể khỏi giỏ hàng.                                                      |
| `Move to Wishlist`   | `Button`   | Lưu khóa học vào danh sách yêu thích và xóa khỏi giỏ.                                   |
| **Order Summary**    |            |                                                                                         |
| `Subtotal`           | `Label`    | Tổng tiền gốc của các khóa học.                                                         |
| `Tax`                | `Label`    | Thuế phí ước tính.                                                                      |
| `Total`              | `Label`    | Tổng số tiền cần thanh toán.                                                            |
| `Checkout`           | `Button`   | Khởi tạo phiên thanh toán (Checkout Session) và chuyển hướng tới trang Checkout.        |

#### Database Access

_Thao tác với giỏ hàng chủ yếu được xử lý ở Frontend (Local Storage/Context). Tuy nhiên, khi nhấn Checkout, hệ thống sẽ xác thực khóa học và khởi tạo phiên thanh toán (CartCheckout)._

| Table          | CRUD     | Description                                                                                 |
| :------------- | :------- | :------------------------------------------------------------------------------------------ |
| `Courses`      | `Read`   | Xác minh sự tồn tại, trạng thái (Ongoing/APPROVED) và giá tiền chuẩn xác của từng khóa học. |
| `CartCheckout` | `Create` | Tạo mới một phiên chờ thanh toán (`PENDING`) với danh sách ID khóa học và tổng tiền.        |
| `Coupons`      | `Read`   | (Tùy chọn) Xác thực tính hợp lệ nếu có mã giảm giá áp dụng sớm.                             |

#### SQL Commands

_Các lệnh SQL tương đương cho hành động Click Checkout._

```sql
-- Validate courses and get current price
SELECT "Id", "Price" FROM "Courses"
WHERE "Id" IN ('[course_id_1]', '[course_id_2]')
  AND "Status" = 'Ongoing' AND "ApprovalStatus" = 'APPROVED';

-- Create Checkout Session
INSERT INTO "CartCheckout" ("UserId", "CourseIds", "TotalAmount", "DiscountAmount", "PaymentMethod", "Status", "CreationTime")
VALUES ('[user_id]', '[json_array]', [total], 0, 'VietQR', 'PENDING', '[now]');
```

---

### 3.2 Payment processing

**a. Checkout Page (Scan to Pay)**

_Màn hình thanh toán sử dụng mã VietQR. Người dùng có thể áp dụng mã giảm giá và quét mã QR bằng ứng dụng ngân hàng để hoàn tất thanh toán._

#### UI Design

_Giao diện hiển thị chi tiết hóa đơn (trái) và mã QR động (phải)._

**<<Mockup prototype>>** _(Checkout Page Image / Payment Success Image)_

| Field Name          | Field Type          | Description                                                         |
| :------------------ | :------------------ | :------------------------------------------------------------------ |
| **Order Details**   |                     |                                                                     |
| `Total Amount`      | `Label`             | Tổng số tiền cuối cùng (sau khi trừ Coupon nếu có).                 |
| `Coupon Code`       | `TextBox`           | Trường nhập mã giảm giá.                                            |
| `Apply`             | `Button`            | Thực thi kiểm tra và áp dụng mã giảm giá.                           |
| `Available Coupons` | `List`              | Danh sách các mã thẻ giảm giá công khai (Public) còn hiệu lực.      |
| `Order ID`          | `Label (Read-only)` | Mã giao dịch tự động sinh ra cho phiên thanh toán.                  |
| `Time Remaining`    | `Timer`             | Đồng hồ đếm ngược thời gian phiên giao dịch kết thúc (VD: 10 phút). |
| **VietQR Display**  |                     |                                                                     |
| `QR Code Image`     | `Image`             | Mã QR code sinh động theo nội dung thanh toán (Napas247/MB Bank).   |

#### Database Access

_Cập nhật chiết khấu qua Coupons và xử lý chốt đơn (Webhook/Simulation) khi thanh toán thành công, ghi nhận hóa đơn học tập (Bills & Enrollments)._

| Table          | CRUD              | Description                                                                        |
| :------------- | :---------------- | :--------------------------------------------------------------------------------- |
| `CartCheckout` | `Read`, `Update`  | Lấy chi tiết phiên thanh toán. Cập nhật `Status` thành `COMPLETED` sau thanh toán. |
| `Coupons`      | `Read`, `Update`  | Kiểm tra lượt sử dụng. Tăng `UsedCount` lên +1.                                    |
| `Bills`        | `Create`          | Khởi tạo biên lai thanh toán (`IsSuccessful = true`, `Gateway = 'VietQR'`).        |
| `Enrollments`  | `Create`/`Update` | Tạo hoặc cập nhật ghi danh (`Active`) để user nhận khóa học tương ứng.             |
| `Wishlist`     | `Delete`          | Xóa/dọn dẹp các khóa học đã mua khỏi danh sách Wishlist của user.                  |

#### SQL Commands

_Các lệnh SQL (Transaction) tương đương cho quá trình Webhook Payment Success._

```sql
BEGIN TRAN;

-- 1. Create Bill
INSERT INTO "Bills" ("Action", "Amount", "Gateway", "IsSuccessful", "CreatorId", "TransactionId", "DiscountAmount", "CouponCode")
VALUES ('Payment', [total], 'VietQR', TRUE, '[user_id]', '[txn_id]', [discount], '[coupon]');

-- 2. Create Enrollments (Upsert for each course)
INSERT INTO "Enrollments" ("CreatorId", "CourseId", "BillId", "Status")
VALUES ('[user_id]', '[course_id]', '[bill_id]', 'Active')
ON CONFLICT ("CreatorId", "CourseId") DO UPDATE SET "Status" = 'Active', "BillId" = '[bill_id]';

-- 3. Update Coupon Usage
UPDATE "Coupons" SET "UsedCount" = "UsedCount" + 1 WHERE "Id" = '[coupon_id]' AND "UsedCount" < "MaxUses";

-- 4. Delete from Wishlist
DELETE FROM "Wishlist" WHERE "UserId" = '[user_id]' AND "CourseId" IN ('[course_ids]');

-- 5. Mark checkout as completed
UPDATE "CartCheckout" SET "Status" = 'COMPLETED', "ProcessedTime" = '[now]' WHERE "Id" = '[checkout_id]';

COMMIT TRAN;
```

---

### 3.3 Transactions

**a. Transaction History**

_Màn hình lịch sử giao dịch trong mục `Settings`. Nơi hiển thị các hóa đơn mua khóa học thành công/thất bại và chi tiết giảm giá._

#### UI Design

_Giao diện danh sách dạng Feed, trực quan hóa từng hóa đơn._

**<<Mockup prototype>>** _(Transactions Page Image)_

| Field Name           | Field Type   | Description                                                                |
| :------------------- | :----------- | :------------------------------------------------------------------------- |
| **Transaction Logs** |              |                                                                            |
| `Transaction Card`   | `Card Block` | Khối chứa thông tin trọn vẹn của một hóa đơn (`Bill`).                     |
| `Status Icon`        | `Icon`       | Dấu tick xanh biểu thị giao dịch thành công.                               |
| `Transaction ID`     | `Label`      | Mã định danh hóa đơn (`ClientTransactionId`).                              |
| `Date`               | `Label`      | Ngày giờ hoàn tất quá trình thanh toán.                                    |
| `Course Info Line`   | `Row`        | Hiển thị Thumbnail, Tên khóa học và giá gốc của khóa học đó trong hóa đơn. |
| `Discount Row`       | `Label`      | Hiển thị mã giảm giá đã áp dụng & số tiền trừ ra (nếu có).                 |
| `Total Amount`       | `Label`      | Tổng tiền trả cho hóa đơn đó.                                              |

#### Database Access

_Lấy thông tin từ bảng `Bills` kết hợp (`JOIN`) nối tới `Enrollments` và `Courses` để hiển thị đầy đủ chi tiết nội dung giao dịch._

| Table         | CRUD   | Description                                                                         |
| :------------ | :----- | :---------------------------------------------------------------------------------- |
| `Bills`       | `Read` | Truy xuất toàn bộ hóa đơn của user (`CreatorId`). Lọc theo giao dịch thành công.    |
| `Enrollments` | `Read` | Join để lấy các bản ghi danh thuật thuộc Bill đó.                                   |
| `Courses`     | `Read` | Join tiếp tục để lấy Title, ThumbUrl hỗ trợ hiển thị (từ Enrollments sang Courses). |

#### SQL Commands

_Các lệnh SQL tương đương cho Transaction History._

```sql
-- Fetch successful transactions (Bills) along with included Courses
SELECT
    b."Id", b."TransactionId", b."CreationTime", b."Amount", b."DiscountAmount", b."CouponCode", b."Gateway",
    e."CourseId",
    c."Title", c."ThumbUrl", c."Price"
FROM "Bills" b
LEFT JOIN "Enrollments" e ON b."Id" = e."BillId"
LEFT JOIN "Courses" c ON e."CourseId" = c."Id"
WHERE b."CreatorId" = '[user_id]' AND b."IsSuccessful" = TRUE
ORDER BY b."CreationTime" DESC;
```
