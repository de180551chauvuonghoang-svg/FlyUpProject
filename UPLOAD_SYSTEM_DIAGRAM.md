# Upload System Architecture Diagram

## ❌ WHAT YOU WERE DOING (Not Working)

```
Supabase Studio (Manual Edit)
    │
    ├─→ Upload file to storage bucket
    │   └─ File goes to: course-videos/ or course-documents/
    │
    └─→ Manually edit LectureMaterial table (or skip it)
        └─ Data NOT properly saved
        └─ API doesn't know about it
        └─ Learn page can't fetch it
        └─ Result: NO VIDEO/MATERIAL SHOWN ❌
```

---

## ✅ WHAT YOU SHOULD DO (Working)

```
Instructor Edit Page (Browser UI)
    │
    ├─→ Select video/material file
    │   └─ Click "Upload Video" or "Add Material"
    │
    ├─→ formData.append("file", file)
    │   formData.append("lectureId", "uuid-123")
    │
    ├─→ HTTP POST /api/upload/video
    │   headers: { Authorization: Bearer token }
    │   body: FormData with file + lectureId
    │
    ├─→ Backend: uploadVideoController
    │   ├─ req.file = multipart buffer
    │   ├─ req.body.lectureId = "uuid-123"
    │   │
    │   ├─ Validate file MIME type ✅
    │   │
    │   ├─ uploadVideo(buffer, name, mimetype)
    │   │   └─ Upload to Supabase storage bucket
    │   │   └─ Return: { url: "https://...", path: "..." }
    │   │
    │   ├─ prisma.lectures.findUnique({Id: lectureId}) ✅
    │   │   └─ Verify lecture exists
    │   │
    │   ├─ prisma.lectureMaterial.deleteMany({
    │   │     LectureId: lectureId,
    │   │     Type: "video"
    │   │   }) ✅
    │   │   └─ Remove old video (1 per lecture max)
    │   │
    │   ├─ prisma.lectureMaterial.create({
    │   │     data: {
    │   │       LectureId: "uuid-123",
    │   │       Type: "video",
    │   │       Url: "https://nyagzdzokj.../video.mp4"
    │   │     }
    │   │   }) ✅ ← THIS IS THE KEY!
    │   │   └─ Database now has record
    │   │
    │   ├─ safeDel(`course:${courseId}`) ✅
    │   │   └─ Invalidate cache
    │   │
    │   └─ Response: { success: true, url, path, type }
    │
    ├─→ Frontend shows: "✅ Video uploaded successfully"
    │
    └─→ Data in Database ✅
        └─ LectureMaterial table has new row
```

---

## COMPLETE FLOW: Upload → Display

```
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: INSTRUCTOR UPLOADS                                    │
├────────────────────────────────────────────────────────────────┤

Instructor Browser
    │
    ├─ Dashboard → My Courses → Select Course → Edit
    │
    ├─ Find Lecture → Click Edit (pencil) → Upload Video
    │
    ├─ Select file: "lesson1.mp4" (50 MB)
    │
    └─ Click "Save"

          ↓↓↓

Frontend: handleSave()
    │
    ├─ videoFormData = new FormData()
    ├─ videoFormData.append("file", lecture.videoFile)
    ├─ videoFormData.append("lectureId", lecture.id)
    │
    └─ POST /api/upload/video with videoFormData

          ↓↓↓

Backend: uploadVideoController
    │
    ├─ req.file = { buffer, mimetype, size: 50MB }
    ├─ req.body.lectureId = "abc-123-def"
    │
    ├─ Validate MIME: "video/mp4" ✅
    │
    ├─ await uploadVideo(buffer, "lesson1.mp4", "video/mp4")
    │  └─ Upload to Supabase
    │  └─ Get URL: "https://cdn.example.com/video.mp4"
    │
    ├─ await prisma.lectureMaterial.create({
    │     LectureId: "abc-123-def",
    │     Type: "video",
    │     Url: "https://cdn.example.com/video.mp4"
    │  })
    │  └─ RECORD CREATED IN DATABASE ✅
    │
    ├─ await safeDel(`course:${courseId}`)
    │  └─ Cache cleared
    │
    └─ return { success: true, url, path, type }

          ↓↓↓

Frontend: Shows "✅ Video uploaded successfully"

└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ STEP 2: DATABASE STATE NOW                                     │
├────────────────────────────────────────────────────────────────┤

LectureMaterial Table:
┌─────────────────────┬────────┬──────────────────────────────┐
│ LectureId           │ Type   │ Url                          │
├─────────────────────┼────────┼──────────────────────────────┤
│ abc-123-def         │ video  │ https://cdn.example.com/...  │
└─────────────────────┴────────┴──────────────────────────────┘

└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ STEP 3: STUDENT VIEWS COURSE (DAYS LATER)                     │
├────────────────────────────────────────────────────────────────┤

Student Browser
    │
    ├─ FlyUp → Browse Courses → Select Bootcamp → Enroll
    │
    └─ Click "Learn" → See Lecture 1

          ↓↓↓

Frontend: CourseLessonPage.jsx
    │
    └─ useEffect: GET /api/courses/{courseId}

          ↓↓↓

Backend: courseService.getCourseById(courseId)
    │
    ├─ SELECT Sections WHERE CourseId = "def-456-ghi"
    │
    ├─ SELECT Lectures WHERE SectionId = "sec-123"
    │
    ├─ SELECT LectureMaterial WHERE LectureId = "abc-123-def"
    │  └─ Gets: { LectureId, Type: "video", Url: "https://..." }
    │
    ├─ Transform to response:
    │  {
    │    Lectures: [{
    │      id: "abc-123-def",
    │      Title: "Lesson 1",
    │      VideoUrl: "https://cdn.example.com/video.mp4",  ← FROM DB
    │      Materials: []
    │    }]
    │  }
    │
    └─ return response

          ↓↓↓

Frontend: normalizeLectureAssets()
    │
    ├─ Extract VideoUrl from response
    ├─ Pass to <VideoPlayer url={VideoUrl} />
    ├─ Display download links for Materials
    │
    └─ Render

          ↓↓↓

Student Sees:
    │
    ├─ Video Player: ▶ [Playing lesson1.mp4]
    │   Progress: 0:00 ————— 12:34
    │
    ├─ Materials:
    │   📄 lesson_notes.pdf (2 MB)
    │   📄 assignments.docx (1 MB)
    │
    └─ Comments: [No comments yet]

✅ SUCCESS! Upload → Database → Display

└────────────────────────────────────────────────────────────────┘
```

---

## KEY DIFFERENCES

### ❌ Manual Supabase Edit
```
Supabase Studio → table editor → Insert row manually
    ↓
File in storage bucket ✓
LectureMaterial row (maybe, but wrong format)
    ↓
API query fails or returns nothing
    ↓
Learn page: 🚫 No video shown
```

### ✅ Instructor Edit Page
```
Browser UI → Click Upload → System handles everything
    ↓
File in storage bucket ✓
LectureMaterial row AUTOMATICALLY created ✓
    ↓
API query finds and returns data ✓
    ↓
Learn page: ▶️ Video plays perfectly
```

---

## Code Locations

| File | Function | Line | What It Does |
|------|----------|------|-------------|
| `routers/upload.js` | router.post("/video", ...) | 29 | Define route |
| `controllers/uploadController.js` | uploadVideoController | 7 | Handle upload + DB insert |
| `services/courseService.js` | getCourseById | 370 | Fetch LectureMaterial + transform |
| `pages/InstructorEditCoursePage.jsx` | handleSave | 330 | Form submission |
| `pages/CourseLessonPage.jsx` | normalizeLectureAssets | 76 | Format data for display |
| `prisma/schema.prisma` | model LectureMaterial | 381 | DB table definition |

---

## Quick Debug

**"Where's my video?"**

1. Check Supabase > Table: LectureMaterial
   - Does row exist? If NO → Need to upload via UI
   - Is `Url` field empty? If YES → Data incomplete
   - Is `Type` = "video"? If NO → Wrong type

2. Check API response: `GET /api/courses/{id}`
   - Look for `VideoUrl` in response
   - Look for `Materials` array

3. Check browser console: `Ctrl+F12` → Network tab
   - See if API call returns data
   - See if frontend receives VideoUrl

**Fix:** Use Instructor Edit Page (NOT manual DB edits)

---

**Summary:** Upload through UI → System saves to LectureMaterial → API fetches → Student sees video ✅
