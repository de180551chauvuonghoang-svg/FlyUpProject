import { apiCall } from "../config/apiConfig";

// Fetch course with all sections and lectures
export const fetchCourseLessons = async (
  courseId,
  isInstructorPreview = false,
) => {
  try {
    console.log(
      "[lessonService] Fetching course lessons for:",
      courseId,
      "isInstructorPreview:",
      isInstructorPreview,
    );

    // Use instructor endpoint if previewing own course
    const endpoint = isInstructorPreview
      ? `/courses/instructor/course/${courseId}`
      : `/courses/${courseId}`;

    const data = await apiCall(endpoint);
    console.log("[lessonService] Course data received:", data);
    const courseData = data.data || data;
    console.log("[lessonService] Processed course data:", courseData);
    return courseData;
  } catch (error) {
    console.error("[lessonService] Failed to fetch course lessons:", error);
    throw error;
  }
};

// Fetch specific lesson details
export const fetchLessonDetails = async (lessonId) => {
  try {
    console.log("[lessonService] Fetching lesson details for:", lessonId);
    const data = await apiCall(`/lectures/${lessonId}`);
    return data.data || data;
  } catch (error) {
    console.error("[lessonService] Failed to fetch lesson details:", error);
    throw error;
  }
};

// Mark lecture as completed
export const markLectureComplete = async (lectureId) => {
  try {
    console.log("[lessonService] Marking lecture complete:", lectureId);
    const data = await apiCall(`/lectures/${lectureId}/complete`, {
      method: "POST",
    });
    return data.data || data;
  } catch (error) {
    console.error("[lessonService] Failed to mark lecture as complete:", error);
    throw error;
  }
};

// Get user enrollment for a specific course
export const fetchEnrollmentProgress = async (userId, courseId) => {
  try {
    console.log(
      "[lessonService] Fetching enrollment progress for user:",
      userId,
      "course:",
      courseId,
    );
    const data = await apiCall(`/users/${userId}/enrollments`);
    console.log("[lessonService] Enrollments data:", data);
    // Find the specific course enrollment from the user's enrollments
    if (data.enrollments && Array.isArray(data.enrollments)) {
      const enrollment = data.enrollments.find((e) => e.CourseId === courseId);
      console.log("[lessonService] Found enrollment for course:", enrollment);
      return enrollment || null;
    }
    console.log("[lessonService] No enrollments found in response");
    return null;
  } catch (error) {
    console.error(
      "[lessonService] Failed to fetch enrollment progress:",
      error,
    );
    throw error;
  }
};
