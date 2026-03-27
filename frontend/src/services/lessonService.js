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

    // Use standard course endpoint - backend handles visibility for authenticated instructors
    const endpoint = `/courses/${courseId}`;

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
    const data = await apiCall(`/courses/lectures/${lectureId}/complete`, {
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

// Finish course and get certificate
export const finishCourse = async (courseId) => {
  try {
    console.log("[lessonService] Finishing course:", courseId);
    const data = await apiCall(`/courses/${courseId}/finish`, {
      method: "POST",
    });
    return data.data || data;
  } catch (error) {
    console.error("[lessonService] Failed to finish course:", error);
    throw error;
  }
};

// Debug: Mark all as complete
export const debugCompleteCourse = async (courseId) => {
  try {
    console.log("[lessonService] Debug completing all for:", courseId);
    const data = await apiCall(`/courses/${courseId}/debug-complete`, {
      method: "POST",
    });
    return data.data || data;
  } catch (error) {
    console.error("[lessonService] Failed to debug complete:", error);
    throw error;
  }
};
