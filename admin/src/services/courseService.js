/**
 * Course Service
 * Handles all course management API calls
 * Currently using fake data for development
 */

// import api from './api';

// Fake delay to simulate API call
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fake courses data
 */
const fakeCourses = [
  {
    id: 1,
    title: 'Complete React Developer Course 2025',
    description: 'Learn React from scratch with hooks, Redux, and more',
    thumbnail: 'https://picsum.photos/seed/react/400/225',
    instructor: {
      id: 2,
      name: 'Jane Smith',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=22c55e&color=fff',
    },
    category: 'Web Development',
    price: 89.99,
    status: 'PENDING', // PENDING, APPROVED, REJECTED, ARCHIVED
    totalLessons: 156,
    totalDuration: '42 hours',
    enrolledCount: 0,
    rating: 0,
    createdAt: '2025-01-15T10:30:00Z',
    submittedAt: '2025-01-16T08:00:00Z',
  },
  {
    id: 2,
    title: 'Advanced Node.js Backend Development',
    description: 'Master Node.js with Express, MongoDB, and microservices',
    thumbnail: 'https://picsum.photos/seed/nodejs/400/225',
    instructor: {
      id: 5,
      name: 'David Brown',
      avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=22c55e&color=fff',
    },
    category: 'Backend Development',
    price: 129.99,
    status: 'APPROVED',
    totalLessons: 189,
    totalDuration: '58 hours',
    enrolledCount: 1245,
    rating: 4.8,
    createdAt: '2024-11-20T14:15:00Z',
    submittedAt: '2024-11-21T09:00:00Z',
    approvedAt: '2024-11-22T16:30:00Z',
  },
  {
    id: 3,
    title: 'Python for Data Science and Machine Learning',
    description: 'Complete guide to Python, Pandas, NumPy, and ML algorithms',
    thumbnail: 'https://picsum.photos/seed/python/400/225',
    instructor: {
      id: 9,
      name: 'Robert Taylor',
      avatar: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=22c55e&color=fff',
    },
    category: 'Data Science',
    price: 149.99,
    status: 'PENDING',
    totalLessons: 234,
    totalDuration: '72 hours',
    enrolledCount: 0,
    rating: 0,
    createdAt: '2025-01-10T09:00:00Z',
    submittedAt: '2025-01-14T11:20:00Z',
  },
  {
    id: 4,
    title: 'UI/UX Design Masterclass',
    description: 'Learn Figma, design principles, and create stunning interfaces',
    thumbnail: 'https://picsum.photos/seed/uiux/400/225',
    instructor: {
      id: 2,
      name: 'Jane Smith',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=22c55e&color=fff',
    },
    category: 'Design',
    price: 79.99,
    status: 'APPROVED',
    totalLessons: 98,
    totalDuration: '28 hours',
    enrolledCount: 892,
    rating: 4.9,
    createdAt: '2024-09-05T11:45:00Z',
    submittedAt: '2024-09-06T10:00:00Z',
    approvedAt: '2024-09-07T14:00:00Z',
  },
  {
    id: 5,
    title: 'AWS Cloud Practitioner Certification Prep',
    description: 'Prepare for AWS certification with hands-on labs',
    thumbnail: 'https://picsum.photos/seed/aws/400/225',
    instructor: {
      id: 5,
      name: 'David Brown',
      avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=22c55e&color=fff',
    },
    category: 'Cloud Computing',
    price: 99.99,
    status: 'REJECTED',
    totalLessons: 85,
    totalDuration: '24 hours',
    enrolledCount: 0,
    rating: 0,
    createdAt: '2025-01-08T08:30:00Z',
    submittedAt: '2025-01-09T14:00:00Z',
    rejectedAt: '2025-01-10T10:30:00Z',
    rejectReason: 'Content quality does not meet our standards. Please improve video quality.',
  },
  {
    id: 6,
    title: 'Flutter Mobile App Development',
    description: 'Build cross-platform mobile apps with Flutter and Dart',
    thumbnail: 'https://picsum.photos/seed/flutter/400/225',
    instructor: {
      id: 9,
      name: 'Robert Taylor',
      avatar: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=22c55e&color=fff',
    },
    category: 'Mobile Development',
    price: 119.99,
    status: 'PENDING',
    totalLessons: 145,
    totalDuration: '38 hours',
    enrolledCount: 0,
    rating: 0,
    createdAt: '2025-01-12T13:20:00Z',
    submittedAt: '2025-01-15T09:30:00Z',
  },
  {
    id: 7,
    title: 'Docker and Kubernetes for Developers',
    description: 'Container orchestration and DevOps best practices',
    thumbnail: 'https://picsum.photos/seed/docker/400/225',
    instructor: {
      id: 5,
      name: 'David Brown',
      avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=22c55e&color=fff',
    },
    category: 'DevOps',
    price: 139.99,
    status: 'APPROVED',
    totalLessons: 112,
    totalDuration: '32 hours',
    enrolledCount: 2156,
    rating: 4.7,
    createdAt: '2024-07-22T15:45:00Z',
    submittedAt: '2024-07-23T08:00:00Z',
    approvedAt: '2024-07-24T11:00:00Z',
  },
  {
    id: 8,
    title: 'JavaScript Algorithms and Data Structures',
    description: 'Master coding interviews with 100+ algorithm challenges',
    thumbnail: 'https://picsum.photos/seed/algorithms/400/225',
    instructor: {
      id: 2,
      name: 'Jane Smith',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=22c55e&color=fff',
    },
    category: 'Programming',
    price: 69.99,
    status: 'APPROVED',
    totalLessons: 178,
    totalDuration: '45 hours',
    enrolledCount: 3421,
    rating: 4.6,
    createdAt: '2024-05-12T10:00:00Z',
    submittedAt: '2024-05-13T09:00:00Z',
    approvedAt: '2024-05-14T16:00:00Z',
  },
  {
    id: 9,
    title: 'Cybersecurity Fundamentals',
    description: 'Learn ethical hacking, network security, and penetration testing',
    thumbnail: 'https://picsum.photos/seed/security/400/225',
    instructor: {
      id: 9,
      name: 'Robert Taylor',
      avatar: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=22c55e&color=fff',
    },
    category: 'Cybersecurity',
    price: 159.99,
    status: 'PENDING',
    totalLessons: 167,
    totalDuration: '52 hours',
    enrolledCount: 0,
    rating: 0,
    createdAt: '2025-01-14T16:30:00Z',
    submittedAt: '2025-01-16T06:00:00Z',
  },
  {
    id: 10,
    title: 'GraphQL API Development',
    description: 'Build modern APIs with GraphQL, Apollo, and PostgreSQL',
    thumbnail: 'https://picsum.photos/seed/graphql/400/225',
    instructor: {
      id: 5,
      name: 'David Brown',
      avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=22c55e&color=fff',
    },
    category: 'Backend Development',
    price: 99.99,
    status: 'APPROVED',
    totalLessons: 89,
    totalDuration: '26 hours',
    enrolledCount: 756,
    rating: 4.5,
    createdAt: '2024-10-25T09:15:00Z',
    submittedAt: '2024-10-26T10:00:00Z',
    approvedAt: '2024-10-27T14:30:00Z',
  },
  {
    id: 11,
    title: 'Vue.js 3 Complete Guide',
    description: 'Learn Vue 3 with Composition API, Pinia, and Vue Router',
    thumbnail: 'https://picsum.photos/seed/vuejs/400/225',
    instructor: {
      id: 2,
      name: 'Jane Smith',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=22c55e&color=fff',
    },
    category: 'Web Development',
    price: 84.99,
    status: 'ARCHIVED',
    totalLessons: 134,
    totalDuration: '36 hours',
    enrolledCount: 1890,
    rating: 4.4,
    createdAt: '2024-03-08T14:00:00Z',
    submittedAt: '2024-03-09T09:00:00Z',
    approvedAt: '2024-03-10T11:00:00Z',
    archivedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 12,
    title: 'Blockchain Development with Solidity',
    description: 'Build decentralized applications on Ethereum',
    thumbnail: 'https://picsum.photos/seed/blockchain/400/225',
    instructor: {
      id: 9,
      name: 'Robert Taylor',
      avatar: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=22c55e&color=fff',
    },
    category: 'Blockchain',
    price: 179.99,
    status: 'PENDING',
    totalLessons: 123,
    totalDuration: '34 hours',
    enrolledCount: 0,
    rating: 0,
    createdAt: '2025-01-16T11:30:00Z',
    submittedAt: '2025-01-17T08:45:00Z',
  },
];

// Store for mutable course data (simulates database)
let coursesStore = [...fakeCourses];

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
    await delay(300);

    // When API is ready, uncomment:
    // return api.get(`/admin/courses?page=${page}&limit=${limit}&search=${search}&status=${status}`);

    // Filter by search
    let filteredCourses = coursesStore;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCourses = filteredCourses.filter(course => 
        course.title.toLowerCase().includes(searchLower) ||
        course.instructor.name.toLowerCase().includes(searchLower) ||
        course.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (status !== 'ALL') {
      filteredCourses = filteredCourses.filter(course => course.status === status);
    }

    // Pagination
    const totalItems = filteredCourses.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

    return {
      courses: paginatedCourses,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  /**
   * Get course by ID
   * @param {number} courseId - Course ID
   * @returns {Promise<Object>}
   */
  getCourseById: async (courseId) => {
    await delay(200);

    // When API is ready, uncomment:
    // return api.get(`/admin/courses/${courseId}`);

    const course = coursesStore.find(c => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  },

  /**
   * Approve a course
   * @param {number} courseId - Course ID to approve
   * @returns {Promise<Object>}
   */
  approveCourse: async (courseId) => {
    await delay(300);

    // When API is ready, uncomment:
    // return api.put(`/admin/courses/${courseId}/approve`);

    const courseIndex = coursesStore.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }

    coursesStore[courseIndex] = {
      ...coursesStore[courseIndex],
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: 'Course approved successfully',
      course: coursesStore[courseIndex],
    };
  },

  /**
   * Reject a course
   * @param {number} courseId - Course ID to reject
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>}
   */
  rejectCourse: async (courseId, reason = '') => {
    await delay(300);

    // When API is ready, uncomment:
    // return api.put(`/admin/courses/${courseId}/reject`, { reason });

    const courseIndex = coursesStore.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }

    coursesStore[courseIndex] = {
      ...coursesStore[courseIndex],
      status: 'REJECTED',
      rejectedAt: new Date().toISOString(),
      rejectReason: reason,
    };

    return {
      success: true,
      message: 'Course rejected',
      course: coursesStore[courseIndex],
    };
  },

  /**
   * Archive a course
   * @param {number} courseId - Course ID to archive
   * @returns {Promise<Object>}
   */
  archiveCourse: async (courseId) => {
    await delay(300);

    // When API is ready, uncomment:
    // return api.put(`/admin/courses/${courseId}/archive`);

    const courseIndex = coursesStore.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }

    coursesStore[courseIndex] = {
      ...coursesStore[courseIndex],
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: 'Course archived successfully',
      course: coursesStore[courseIndex],
    };
  },

  /**
   * Search courses (debounced on frontend)
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  searchCourses: async (query) => {
    await delay(200);

    // When API is ready, uncomment:
    // return api.get(`/admin/courses/search?q=${query}`);

    if (!query) return [];

    const searchLower = query.toLowerCase();
    return coursesStore
      .filter(course => 
        course.title.toLowerCase().includes(searchLower) ||
        course.instructor.name.toLowerCase().includes(searchLower)
      )
      .slice(0, 5); // Limit to 5 suggestions
  },
};

export default courseService;
