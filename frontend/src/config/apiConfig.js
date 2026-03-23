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
  let token = localStorage.getItem("accessToken");

  const getHeaders = (currentToken) => ({
    "Content-Type": "application/json",
    ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    ...options.headers,
  });

  let response = await fetch(`${API_BASE_URL}${url}`, {
    headers: getHeaders(token),
    credentials: "include",
    ...options,
  });

  // Handle Token Expiration
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.accessToken) {
            token = refreshData.accessToken;
            localStorage.setItem("accessToken", token);
            // Retry the original request
            response = await fetch(`${API_BASE_URL}${url}`, {
              headers: getHeaders(token),
              credentials: "include",
              ...options,
            });
          }
        } else {
          // Refresh failed, clear tokens
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login"; // Force re-login
        }
      } catch (err) {
        console.error("Token refresh failed", err);
      }
    }
  }

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
