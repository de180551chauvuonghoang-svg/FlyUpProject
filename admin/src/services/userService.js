/**
 * User Service
 * Handles all user management API calls
 * Currently using fake data for development
 */

// import api from './api';

// Fake delay to simulate API call
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fake users data
 */
const fakeUsers = [
  {
    id: 1,
    email: 'john.doe@example.com',
    fullName: 'John Doe',
    phone: '+1 234 567 890',
    role: 'STUDENT',
    status: 'ACTIVE',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=a855f7&color=fff',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2025-01-17T08:45:00Z',
  },
  {
    id: 2,
    email: 'jane.smith@example.com',
    fullName: 'Jane Smith',
    phone: '+1 234 567 891',
    role: 'INSTRUCTOR',
    status: 'ACTIVE',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=22c55e&color=fff',
    createdAt: '2024-02-20T14:15:00Z',
    lastLogin: '2025-01-16T16:30:00Z',
  },
  {
    id: 3,
    email: 'mike.wilson@example.com',
    fullName: 'Mike Wilson',
    phone: '+1 234 567 892',
    role: 'STUDENT',
    status: 'LOCKED',
    avatar: 'https://ui-avatars.com/api/?name=Mike+Wilson&background=ef4444&color=fff',
    createdAt: '2024-03-10T09:00:00Z',
    lastLogin: '2025-01-10T11:20:00Z',
  },
  {
    id: 4,
    email: 'sarah.johnson@example.com',
    fullName: 'Sarah Johnson',
    phone: '+1 234 567 893',
    role: 'STUDENT',
    status: 'ACTIVE',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=a855f7&color=fff',
    createdAt: '2024-04-05T11:45:00Z',
    lastLogin: '2025-01-17T07:15:00Z',
  },
  {
    id: 5,
    email: 'david.brown@example.com',
    fullName: 'David Brown',
    phone: '+1 234 567 894',
    role: 'INSTRUCTOR',
    status: 'ACTIVE',
    avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=22c55e&color=fff',
    createdAt: '2024-05-12T08:30:00Z',
    lastLogin: '2025-01-15T14:00:00Z',
  },
  {
    id: 6,
    email: 'emily.davis@example.com',
    fullName: 'Emily Davis',
    phone: '+1 234 567 895',
    role: 'STUDENT',
    status: 'ACTIVE',
    avatar: 'https://ui-avatars.com/api/?name=Emily+Davis&background=a855f7&color=fff',
    createdAt: '2024-06-18T13:20:00Z',
    lastLogin: '2025-01-17T09:30:00Z',
  },
  {
    id: 7,
    email: 'chris.martin@example.com',
    fullName: 'Chris Martin',
    phone: '+1 234 567 896',
    role: 'STUDENT',
    status: 'LOCKED',
    avatar: 'https://ui-avatars.com/api/?name=Chris+Martin&background=ef4444&color=fff',
    createdAt: '2024-07-22T15:45:00Z',
    lastLogin: '2025-01-05T10:10:00Z',
  },
  {
    id: 8,
    email: 'lisa.anderson@example.com',
    fullName: 'Lisa Anderson',
    phone: '+1 234 567 897',
    role: 'STUDENT',
    status: 'ACTIVE',
    avatar: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=a855f7&color=fff',
    createdAt: '2024-08-30T10:00:00Z',
    lastLogin: '2025-01-16T12:45:00Z',
  },
  {
    id: 9,
    email: 'robert.taylor@example.com',
    fullName: 'Robert Taylor',
    phone: '+1 234 567 898',
    role: 'INSTRUCTOR',
    status: 'ACTIVE',
    avatar: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=22c55e&color=fff',
    createdAt: '2024-09-14T16:30:00Z',
    lastLogin: '2025-01-17T06:00:00Z',
  },
  {
    id: 10,
    email: 'amanda.white@example.com',
    fullName: 'Amanda White',
    phone: '+1 234 567 899',
    role: 'STUDENT',
    status: 'ACTIVE',
    avatar: 'https://ui-avatars.com/api/?name=Amanda+White&background=a855f7&color=fff',
    createdAt: '2024-10-25T09:15:00Z',
    lastLogin: '2025-01-14T17:20:00Z',
  },
  {
    id: 11,
    email: 'kevin.garcia@example.com',
    fullName: 'Kevin Garcia',
    phone: '+1 234 567 900',
    role: 'STUDENT',
    status: 'ACTIVE',
    avatar: 'https://ui-avatars.com/api/?name=Kevin+Garcia&background=a855f7&color=fff',
    createdAt: '2024-11-08T14:00:00Z',
    lastLogin: '2025-01-17T10:30:00Z',
  },
  {
    id: 12,
    email: 'nicole.lee@example.com',
    fullName: 'Nicole Lee',
    phone: '+1 234 567 901',
    role: 'STUDENT',
    status: 'LOCKED',
    avatar: 'https://ui-avatars.com/api/?name=Nicole+Lee&background=ef4444&color=fff',
    createdAt: '2024-12-01T11:30:00Z',
    lastLogin: '2025-01-02T08:45:00Z',
  },
];

// Store for mutable user data (simulates database)
let usersStore = [...fakeUsers];

/**
 * User Service Object
 */
const userService = {
  /**
   * Get users list with pagination and search
   * @param {Object} params - Query parameters
   * @param {number} params.page - Current page (1-indexed)
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search query
   * @param {string} params.status - Filter by status ('ALL' | 'ACTIVE' | 'LOCKED')
   * @returns {Promise<Object>}
   */
  getUsers: async ({ page = 1, limit = 10, search = '', status = 'ALL' } = {}) => {
    await delay(300);

    // When API is ready, uncomment:
    // return api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}&status=${status}`);

    // Filter by search
    let filteredUsers = usersStore;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(search)
      );
    }

    // Filter by status
    if (status !== 'ALL') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    // Pagination
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
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
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  getUserById: async (userId) => {
    await delay(200);

    // When API is ready, uncomment:
    // return api.get(`/admin/users/${userId}`);

    const user = usersStore.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },

  /**
   * Lock a user account
   * @param {number} userId - User ID to lock
   * @returns {Promise<Object>}
   */
  lockUser: async (userId) => {
    await delay(300);

    // When API is ready, uncomment:
    // return api.put(`/admin/users/${userId}/lock`);

    const userIndex = usersStore.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    usersStore[userIndex] = {
      ...usersStore[userIndex],
      status: 'LOCKED',
    };

    return {
      success: true,
      message: 'User locked successfully',
      user: usersStore[userIndex],
    };
  },

  /**
   * Unlock a user account
   * @param {number} userId - User ID to unlock
   * @returns {Promise<Object>}
   */
  unlockUser: async (userId) => {
    await delay(300);

    // When API is ready, uncomment:
    // return api.put(`/admin/users/${userId}/unlock`);

    const userIndex = usersStore.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    usersStore[userIndex] = {
      ...usersStore[userIndex],
      status: 'ACTIVE',
    };

    return {
      success: true,
      message: 'User unlocked successfully',
      user: usersStore[userIndex],
    };
  },

  /**
   * Search users (debounced on frontend)
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  searchUsers: async (query) => {
    await delay(200);

    // When API is ready, uncomment:
    // return api.get(`/admin/users/search?q=${query}`);

    if (!query) return [];

    const searchLower = query.toLowerCase();
    return usersStore
      .filter(user => 
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )
      .slice(0, 5); // Limit to 5 suggestions
  },
};

export default userService;
