# Hướng Dẫn Upload Avatar Với Cloudinary

Tài liệu này mô tả cách thực hiện chức năng upload avatar lên Cloudinary trong dự án React, sử dụng `fetch` API và `FormData`.

## Cấu Hình Cần Thiết

Để upload thành công, bạn cần các thông tin sau từ Cloudinary Dashboard:
- **Cloud Name**: `dduyqntd6`
- **Upload Preset**: `wo5grbii` (đây là unsigned preset, cho phép upload trực tiếp từ client mà không cần xác thực server-side phức tạp).
- **API Endpoint**: `https://api.cloudinary.com/v1_1/dduyqntd6/image/upload`

## Đoạn Code Xử Lý Upload

Dưới đây là hàm `handleFileChange` được trích xuất từ `ProfilePage.jsx`, xử lý việc chọn file và upload:

```javascript
  const handleFileChange = async (e) => {
    // 1. Lấy file từ sự kiện input
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true); // Bắt đầu trạng thái loading

      // 2. Chuẩn bị dữ liệu FormData
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', 'wo5grbii'); // Unsigned preset
      data.append('cloud_name', 'dduyqntd6'); 

      // 3. Gọi API của Cloudinary
      const response = await fetch('https://api.cloudinary.com/v1_1/dduyqntd6/image/upload', {
        method: 'POST',
        body: data
      });

      const result = await response.json();
      
      // 4. Kiểm tra lỗi
      if (!response.ok) {
        throw new Error(result.error?.message || 'Upload failed');
      }

      // 5. Cập nhật URL ảnh mới vào state
      // result.secure_url chứa đường dẫn ảnh HTTPS direct link
      setFormData(prev => ({ ...prev, avatarUrl: result.secure_url }));
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false); // Kết thúc trạng thái loading
      
      // 6. Reset input file để cho phép chọn lại cùng 1 file nếu cần
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
```

## Giải Thích Chi Tiết

1.  **Selection**: Lấy file đầu tiên từ `e.target.files`.
2.  **FormData**: Tạo đối tượng `FormData` để gửi dữ liệu dạng `multipart/form-data`, yêu cầu bắt buộc của Cloudinary API.
    *   `file`: File ảnh gốc.
    *   `upload_preset`: Preset cấu hình sẵn trên Cloudinary (kích thước, định dạng, folder, v.v.).
    *   `cloud_name`: Tên tài khoản Cloudinary.
3.  **Request**: Gửi request `POST` đến endpoint của Cloudinary. Không cần header `Content-Type` vì trình duyệt sẽ tự động thiết lập cho `FormData`.
4.  **Response Handling**:
    *   Nếu thành công, Cloudinary trả về JSON chứa thông tin ảnh. Quan trọng nhất là `secure_url`.
    *   Lưu `secure_url` này vào state hoặc database của bạn để hiển thị avatar người dùng.

## Lưu Ý Bảo Mật

*   **Upload Preset**: Preset `wo5grbii` hiện tại đang là **Unsigned**. Điều này tiện lợi cho dev nhưng trên production nên cân nhắc giới hạn domain hoặc sử dụng Signed Upload nếu cần bảo mật cao hơn.
*   **Validation**: Nên kiểm tra loại file (chỉ ảnh) và kích thước file trước khi upload để tiết kiệm băng thông và tăng trải nghiệm người dùng.
