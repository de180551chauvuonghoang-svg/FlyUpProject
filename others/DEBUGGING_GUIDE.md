# Debugging CourseLessonPage - Quick Checklist

## Step 1: Open Browser DevTools (F12)

- Go to **Console** tab
- Look for console logs from `[lessonService]` and `[CourseLessonPage]`

## Step 2: Check Network Tab

1. Click on **Network** tab
2. Look for API calls:
   - `GET /api/courses/{courseId}` - Should return course with Sections & Lectures
   - `GET /api/users/{userId}/enrollments` - Should return user's enrollments

## Step 3: Expected Console Logs

```
[lessonService] Fetching course lessons for: {courseId}
[lessonService] Course data received: {...}
[lessonService] Processed course data: {...}
[CourseLessonPage] Course data: {...}
[CourseLessonPage] Enrollment data: {...}
```

## Step 4: Common Issues & Solutions

### Issue: "Loading course..." stays forever

**Solution**:

- Check Network tab for `GET /api/courses/{courseId}`
- If not called: courseId is undefined
- If fails: API error (check response)

### Issue: Course loads but no sections shown

**Solution**:

- Verify course data has `Sections` array
- Check if Sections have `Lectures` array
- Look for errors in transformSections function

### Issue: Navigation not working

**Solution**:

- Check React Router is working (URL should change)
- Verify courseId and lessonId are in URL
- Check useNavigate hook is working

## Step 5: Manual Test

1. **Ensure Backend Running**

   ```bash
   cd backend
   npm run dev
   ```

2. **Ensure Frontend Running**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow**
   - Go to My Learning
   - Click on an enrolled course
   - Check browser console for logs
   - Verify you see the lesson page

## Step 6: If Still Not Working

1. Check browser console for JavaScript errors
2. Check Network tab for failed API calls
3. Check backend console for error logs
4. Verify user is actually enrolled (check DB or Network tab response)

## Backend Logs to Check

```bash
# Terminal running backend (npm run dev)
# Look for logs like:
[courseService] Fetching course: {courseId}
[courseService] Course found: Yes
[API] Get Enrollments for User {userId} - Page 1
```
