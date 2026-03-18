# Upload Fix Guide - Save Videos/Materials to LectureMaterial Table

## Problem Summary
When you upload videos/materials to a bootcamp course, they're **NOT being saved to the `LectureMaterial` table**, so they don't appear on the learn page.

## Root Cause Identified
You've been uploading files **directly in Supabase Studio** (table editor), which:
- ✅ Stores files in Supabase storage bucket
- ❌ Does NOT create records in `LectureMaterial` table
- ❌ Does NOT trigger API layer (uploadVideoController / uploadDocumentController)
- ❌ Data never reaches the LectureMaterial table

## Solution: Use the Instructor Edit Page

### Step 1: Go to Instructor Edit Page
Navigate to: **Instructor Dashboard → Select Bootcamp Course → Edit Course**

### Step 2: Upload Videos Correctly
1. Click **"Edit"** on a Lecture in a Section
2. Click **"Upload Video"** button
3. Select your video file  
4. ✅ This triggers: `POST /api/upload/video` with `lectureId`
5. Backend automatically:
   - Uploads to Supabase storage
   - Creates `LectureMaterial` record with Type='video'
   - Invalidates cache
   - Returns success

### Step 3: Upload Materials (Documents) Correctly  
1. Same lecture edit modal
2. Click **"Add Material"** button
3. Select PDF/DOC/PPTX file
4. ✅ This triggers: `POST /api/upload/document` with `lectureId`
5. Backend automatically:
   - Uploads to Supabase storage
   - Creates `LectureMaterial` record with Type='document'
   - Invalidates cache
   - Returns success

### Step 4: Verify Data Saved
1. **Check Database:**
   - Open Supabase Studio
   - Go to table `LectureMaterial`
   - Look for rows with:
     - `LectureId` = your lecture UUID
     - `Type` = 'video' or 'document'
     - `Url` = path to file in Supabase

2. **Check Learn Page:**
   - Open FlyUp as student
   - Enroll in bootcamp course
   - Navigate to course → lesson
   - Videos appear in player
   - Materials shown in download section

## Important: Never Manually Edit Supabase

❌ **DO NOT:**
```
- Edit files directly in Supabase Studio
- Manually insert rows into LectureMaterial table
- Upload to storage bucket manually
```

✅ **ALWAYS:**
```
- Use Instructor Edit Page → Upload Video/Material
- System handles everything automatically
- Data gets proper LectureMaterial records
```

## How It Works (Technical)

### Upload Flow
```
Frontend (edit page)
  ↓
POST /api/upload/video (with lectureId in FormData)
  ↓
Backend uploadVideoController
  ├─ Validate file type ✅
  ├─ Upload to Supabase storage bucket
  ├─ Create LectureMaterial record
  └─ Invalidate cache
  ↓
Response: { success: true, url: "...", path: "..." }
```

### Display Flow
```
Student views course
  ↓
Frontend calls: GET /api/courses/{courseId}
  ↓
Backend courseService.getCourseById()
  ├─ Fetch Lectures
  ├─ Fetch LectureMaterial where Type='video'
  ├─ Fetch LectureMaterial where Type='document'
  └─ Transform to VideoUrl and Materials array
  ↓
Response includes:
{
  "Lectures": [
    {
      "VideoUrl": "https://...",
      "Materials": [
        { "Url": "https://...", "Type": "pdf", ... }
      ]
    }
  ]
}
  ↓
Frontend (CourseLessonPage.jsx) displays:
- Video player with VideoUrl
- Download link for each Material
```

## Backend Verification ✅

All upload endpoints are working:
- ✅ `POST /api/upload/video` - Insert into LectureMaterial with Type='video'
- ✅ `POST /api/upload/document` - Insert into LectureMaterial with Type='document'
- ✅ `GET /api/courses/{courseId}` - Read from LectureMaterial and transform
- ✅ Cache invalidation working
- ✅ Frontend normalization handles response

## Troubleshooting

### Issue: System says "Upload failed"
**Check:**
1. File size < 100MB
2. File type allowed (MP4, PDF, DOCX, PPTX, etc.)
3. You're logged in as instructor
4. Course exists and is published

### Issue: Upload succeeds but video/material not on learn page
**Check:**
1. Open Supabase → LectureMaterial table
2. Verify row exists with your lectureId
3. Type = 'video' or 'document'
4. Url is filled in
5. Refresh course learn page (clear browser cache)

### Issue: Video/material visible on edit page but not on learn page
**Possible reasons:**
1. Student not enrolled in course
2. Course not published
3. Lecture is in section that's not visible
4. Browser cache not cleared

**Solution:**
```
1. Clear browser cache: Ctrl+Shift+Delete
2. Hard refresh: Ctrl+F5
3. Open dev tools → Network tab
4. Check if API returns LectureMaterial
```

## Summary

✅ **What works:**
- Upload through Instructor Edit Page UI
- Automatic LectureMaterial database entry
- Supabase storage integration
- Learn page display via API

❌ **What doesn't work:**
- Manual Supabase Studio uploads
- Direct database editing
- Bypassing API layer

**Bottom Line:** Always use the Instructor Edit Page for uploading videos and materials. The system handles everything else automatically by saving to the `LectureMaterial` table and serving it to the learn page.
