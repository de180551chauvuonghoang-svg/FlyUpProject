# 🚀 Upload Videos/Materials - Quick Reference

## The Problem ❌
You uploaded videos/materials but they're not showing on the learning page because you edited directly in Supabase (bypasses database records).

## The Solution ✅
**Use the Instructor Edit Page** - System automatically saves to `LectureMaterial` table.

---

## 5-Minute Setup

### Option 1: Upload Single Video/Material

**In Browser:**
1. Go: Dashboard → My Courses → Select Course → Edit
2. Find Lecture → Click Edit (pencil icon)
3. Click "Upload Video" or "Add Material"  
4. Select file
5. Click "Save"
6. **Done!** ✅ Automatically saved to `LectureMaterial`

### Option 2: Bulk Upload Many Videos

If uploading many at once, you can still:
1. Go to edit course
2. Upload videos for each lecture one by one (system queues them)
3. Click "Save Course" once
4. All uploads happen automatically

---

## What Happens Behind Scenes

```
Your Upload
   ↓
POST /api/upload/video (your browser → backend)
   ↓
Backend: uploadVideoController
   ├─ Upload file to Supabase storage
   ├─ Get file URL back
   ├─ INSERT INTO LectureMaterial (THIS IS KEY!)
   │  VALUES (lectureId, 'video', 'https://...')
   └─ Send success response
   ↓
Database Updated ✅
   ↓
Student Opens Course
   ↓
API Fetches LectureMaterial
   ├─ Find all videos for this lecture
   ├─ Find all documents for this lecture  
   └─ Return to student
   ↓
Learn Page Shows Video + Materials ✅
```

---

## Verification Checklist

After uploading, verify:

- [ ] Upload button says "Success" or no error
- [ ] Go to Supabase → LectureMaterial table
- [ ] See new row with:
  - `LectureId` = your lecture UUID
  - `Type` = 'video' (or 'document')
  - `Url` = has value (https://...)
- [ ] Refresh learn page
- [ ] Video/material appears

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Upload button missing | Course must be published |
| File too large error | Max 100MB, compress video |
| Can't find lecture | Make sure course published |
| Upload succeeds but doesn't show | Clear browser cache (Ctrl+Shift+Delete) |
| Still no data after reload | Check LectureMaterial table in Supabase |

---

## Important ⚠️

### What Works ✅
- Uploading via Edit Course page
- Video player displays automatically
- Materials download links work
- Multiple materials per lecture OK
- One video per lecture max (old one replaced)

### What Doesn't Work ❌
- Manual Supabase table edits (no API layer)
- Direct DB inserts (misses cache invalidation)
- Uploading to storage bucket directly (must use API)

---

## Command Line (Advanced)

If you have access to API token:

```bash
# Upload video
curl -X POST http://localhost:5000/api/upload/video \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@video.mp4" \
  -F "lectureId=123-456-789"

# Check if saved
SELECT * FROM LectureMaterial 
WHERE LectureId = '123-456-789';
```

---

## Still Need Help?

1. **Check backend logs** - see upload confirmation
2. **Check Supabase** - see LectureMaterial row created
3. **Check API response** - see VideoUrl in response
4. **Clear cache** - browser might be caching old data
5. **Refresh page** - hard refresh with Ctrl+F5

---

## File Size & Type Restrictions

### Video Upload
- **Max Size:** 100 MB
- **Allowed Types:** MP4, MPEG, MOV, AVI
- **Per Lecture:** Maximum 1 (new replaces old)

### Material Upload  
- **Max Size:** 100 MB (per file)
- **Allowed Types:** PDF, DOC, DOCX, PPT, PPTX, TXT
- **Per Lecture:** Unlimited

---

**Status:** ✅ System Working | All files uploaded go to LectureMaterial table | Learn page displays all materials automatically
