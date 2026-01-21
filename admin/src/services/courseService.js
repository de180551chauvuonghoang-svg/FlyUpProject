/**
 * Course Service
 * Handles all course management API calls
 */

import api from './api';

/**
 * Course Service Object
 */
const courseService = {
  /**
   * Get courses list with pagination and search
   * @param {Object} params - Query parameters
   * @param {number} params.page - Current page (1-indexed)
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search query
   * @param {string} params.status - Filter by status ('ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED')
   * @returns {Promise<Object>}
   */
  getCourses: async ({ page = 1, limit = 10, search = '', status = 'ALL' } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status
    });
    return api.get(`/admin/courses?${params.toString()}`);
  },

  /**
   * Get course by ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>}
   */
  getCourseById: async (courseId) => {
    const response = await api.get(`/admin/courses/${courseId}`);
    return response.course;
  },

  /**
   * Approve a course
   * @param {string} courseId - Course ID to approve
   * @returns {Promise<Object>}
   */
  approveCourse: async (courseId) => {
    return api.put(`/admin/courses/${courseId}/approve`, {});
  },

  /**
   * Reject a course
   * @param {string} courseId - Course ID to reject
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>}
   */
  rejectCourse: async (courseId, reason = '') => {
    return api.put(`/admin/courses/${courseId}/reject`, { reason });
  },

  /**
   * Archive a course
   * @param {string} courseId - Course ID to archive
   * @returns {Promise<Object>}
   */
  archiveCourse: async (courseId) => {
    return api.put(`/admin/courses/${courseId}/archive`, {});
  },

  /**
   * Search courses (debounced on frontend)
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  searchCourses: async (query) => {
    if (!query) return [];
    const response = await api.get(`/admin/courses?search=${encodeURIComponent(query)}&limit=5`);
    return response.courses || [];
  },
};

export default courseService;
