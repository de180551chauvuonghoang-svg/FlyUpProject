export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_VERIFY: "/auth/verify",

  // Courses
  COURSES_LIST: "/courses",
  COURSES_DETAIL: (id) => `/courses/${id}`,
  COURSES_CATEGORIES: "/courses/categories",

  // Lessons
  LESSONS_DETAIL: (id) => `/lectures/${id}`,
  LESSONS_COMPLETE: (id) => `/lectures/${id}/complete`,

  // Enrollments
  ENROLLMENTS_PROGRESS: (courseId) => `/enrollments/${courseId}`,

  // Users
  USERS_PROFILE: "/users/profile",
  USERS_ENROLLMENTS: "/users/enrollments",
};

// API Helper functions
export const apiCall = async (url, options = {}) => {
  // Get token from localStorage
  const token = localStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers,
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS,
  apiRequest: apiCall,
};
