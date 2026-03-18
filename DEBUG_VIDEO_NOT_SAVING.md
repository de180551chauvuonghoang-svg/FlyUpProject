# 🔍 DEBUG: Tại Sao Video Không Được Lưu Vào LectureMaterial

**Vấn đề:** Video upload nhưng không hiện trong LectureMaterial table  
**Nguyên nhân có thể:** lectureId không được gửi hoặc không được xử lý đúng

---

## Step 1: Kiểm Tra Backend Logs 🔍

### Cách 1: Xem logs live (Tốt nhất)

1. Mở terminal mới
2. Chạy:
```bash
cd backend
npm run dev
```

3. Để ý output khi bạn upload video
4. Tìm dòng này:
```
[UPLOAD_VIDEO] lectureId received: { value: "...", type: "string", isEmpty: false }
```

### Cách 2: Kiểm tra logs after the fact

Nếu đã upload rồi, hãy xem file log (nếu có) hoặc:

```bash
# Check console output từ lần upload cuối cùng
# Tìm các dòng [UPLOAD_VIDEO] để xem chuyện gì xảy ra
```

---

## Step 2: Inspect Network Request 🌐

1. **Mở browser DevTools:** 
   - Press: `F12` hoặc `Right-Click → Inspect`

2. **Mở tab Network**

3. **Upload video lần nữa**

4. **Tìm request:** `upload/video` trong Network tab

5. **Click vào request**

6. **Đi tab "Payload" (hoặc "FormData")**

7. **Kiểm tra:**
   ```
   file: [test-video.mp4] ✅
   lectureId: [046d55f9-...] ✅ ← PHẢI CÓ!
   ```

---

## Step 3: Kiểm Tra Backend Logs Cụ Thể 🔎

Khi bạn upload video, backend sẽ print:

### ✅ Kết Quả ĐÚNG (Video được lưu):
```
[UPLOAD_VIDEO_START] timestamp: 2026-03-17T..., file: { name: "video.mp4", size: 5000000 }, lectureId: "446d55f9-eb87-4019-..."

[UPLOAD_VIDEO] lectureId received: { value: "446d55f9-eb87-4019-...", type: "string", isEmpty: false }

[UPLOAD_VIDEO] Uploading to Supabase...

[UPLOAD_VIDEO] Supabase response: { url: "https://...", path: "course-videos/..." }

[UPLOAD_VIDEO] Checking lecture: 446d55f9-eb87-4019-...

[UPLOAD_VIDEO] Lecture found, deleting old videos...

[UPLOAD_VIDEO] Old videos deleted: 0

[UPLOAD_VIDEO] Creating new material record...

[UPLOAD_VIDEO] Material created: { LectureId: "446d55f9-eb87-4019-...", Id: 1, Type: "video" }

[UPLOAD_VIDEO] Cache invalidated for course: c4e06ec6-21b4-470c-...

[UPLOAD_VIDEO_END] Success
```

### ❌ Kết Quả SAI (Video KHÔNG được lưu):
```
[UPLOAD_VIDEO_START] timestamp: 2026-03-17T..., file: { name: "video.mp4", size: 5000000 }, lectureId: undefined

[UPLOAD_VIDEO] lectureId received: { value: undefined, type: "undefined", isEmpty: true }

⚠️ WARNING: lectureId NOT provided!

File uploaded to storage but NOT saved to database!
```

---

## Step 4: Xác Định Problem 🎯

### Nếu logs show "lectureId: undefined"

**Problem:** Frontend KHÔNG gửi lectureId  
**Solution:** Kiểm tra InstructorEditCoursePage.jsx dòng 448-452

```javascript
const videoFormData = new FormData();
videoFormData.append("file", lecture.videoFile);
videoFormData.append("lectureId", lectureId);  // ← Phải có cái này
```

**Debug:**
```javascript
// Thêm vào trước fetch:
console.log("Uploading video:", {
  file: lecture.videoFile?.name,
  lectureId: lectureId,
  isIdEmpty: !lectureId,
});
```

### Nếu logs show "lectureId: '446d55f9...'" nhưng không create record

**Problem:** Database error hoặc Prisma issue  
**Solution:** Kiểm tra:

```bash
# 1. Lecture tồn tại?
SELECT * FROM "Lectures" WHERE "Id" = '446d55f9-eb87-4019-...';

# 2. LectureMaterial table tồn tại?
SELECT * FROM "LectureMaterial" LIMIT 5;

# 3. Có permissions?
# Check Supabase RLS policies
```

### Nếu logs show "Lecture not found"

**Problem:** lectureId sai hoặc lecture bị xoá  
**Solution:**
```bash
# Kiểm tra ID đúng không
SELECT * FROM "Lectures" WHERE "Id" = '446d55f9-...';

# Nếu không hiện → ID sai
# Nếu hiện → Có vấn đề khác
```

---

## Step 5: Kiểm Tra Upload Response 📊

Mở browser DevTools → Network → Click vào POST /upload/video

### Tab "Response":

**✅ Kết Quả tốt:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "url": "https://nyagzdzokj....",
    "path": "course-videos/...",
    "type": "video"
  }
}
```

**❌ Kết Quả xấu:**
```json
{
  "error": "Upload failed",
  "message": "Cannot find lecture"
}
```

### Tab "Headers" → Response headers

Kiểm tra:
- `Status: 200 OK` ✅
- Nếu `400` hoặc `404` → Error
- Nếu `500` → Server error

---

## Step 6: So Sánh Video vs Document 📝

### Khi upload DOCUMENT (hoạt động):
- Logs có lectureId ✓
- Supabase response OK ✓
- LectureMaterial record tạo ✓
- Type = "document" ✓

### Khi upload VIDEO (không hoạt động):
- Logs có lectureId? → **Kiểm tra**
- Supabase response OK? → **Kiểm tra**
- LectureMaterial record tạo? → **Không, nên lectureId missing**
- Type = "video"? → **Không tấn công được**

---

## Hành Động Ngay Bây Giờ 🚀

### 1. Chạy backend với monitoring:
```bash
cd backend
npm run dev
```

### 2. Upload video 1 cái từ Edit Course page

### 3. Kiểm tra backend console output

### 4. Copy 5-10 dòng [UPLOAD_VIDEO] logs

### 5. Share logs ở đây

---

## Logs Cần Cung Cấp

Khi bạn report problem, cung cấp:

1. **Backend logs** khi upload video (từ [UPLOAD_VIDEO_START] đến [UPLOAD_VIDEO_END])
2. **Network request payload** từ browser DevTools
3. **Supabase database** - kiểm tra xem video file có trong storage không?
4. **Error message** nếu có

---

## Quick Checklist

- [ ] Backend đang chạy?
- [ ] Video file < 100MB?
- [ ] File format = MP4/MOV/AVI?
- [ ] lectureId được gửi (check FormData)?
- [ ] lectureId trong logs?
- [ ] Backend logs có error?
- [ ] Response status 200?
- [ ] LectureMaterial table có record?

---

## Debugging Commands

```bash
# 1. Check backend running
curl http://localhost:5000/api/health

# 2. Check lecture exists
psql $DATABASE_URL -c "SELECT \"Id\", \"Title\" FROM \"Lectures\" LIMIT 3;"

# 3. Check LectureMaterial videos only
psql $DATABASE_URL -c "SELECT * FROM \"LectureMaterial\" WHERE \"Type\" = 'video' LIMIT 10;"

# 4. Check LectureMaterial documents
psql $DATABASE_URL -c "SELECT * FROM \"LectureMaterial\" WHERE \"Type\" = 'document' LIMIT 10;"

# 5. Count by type
psql $DATABASE_URL -c "SELECT \"Type\", COUNT(*) FROM \"LectureMaterial\" GROUP BY \"Type\";"
```

---

**Report findings here đễ mình debug tiếp!**
