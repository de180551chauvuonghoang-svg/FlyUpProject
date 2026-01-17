/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 * Currently using fake data for development
 */

// import api from './api';

// Fake delay to simulate API call
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fake statistics data
 */
const fakeStatistics = {
    totalCadets: {
        value: 18420,
        trend: 12.5,
        label: 'Total Cadets',
    },
    creditsEarned: {
        value: 45200,
        trend: 8.3,
        label: 'Credits Earned',
        isCurrency: true,
    },
    fleetUnits: {
        value: 12,
        trend: -2.1,
        label: 'Fleet Units',
    },
    approvalRate: {
        value: 4.9,
        trend: 0.3,
        label: 'Approval Rate',
        suffix: '/5',
    },
};

/**
 * Fake revenue chart data
 */
const fakeRevenueData = {
    quarterly: {
        labels: ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6', 'Sector 7'],
        data: [4500, 5200, 4800, 6200, 7800, 6500, 8200],
    },
    yearly: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        data: [45000, 52000, 61000, 78000],
    },
    max: {
        labels: ['2021', '2022', '2023', '2024', '2025'],
        data: [120000, 185000, 230000, 295000, 350000],
    },
};

/**
 * Fake courses data
 */
const fakeCourses = [
    {
        id: 1,
        title: 'Advanced Warp Engine Design',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
        status: 'BUILDING',
        studentsCount: 8200,
        rating: 4.8,
    },
    {
        id: 2,
        title: 'Quantum Cryptography 101',
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
        status: 'ORBITING',
        studentsCount: 4100,
        rating: 5.0,
    },
    {
        id: 3,
        title: 'Galactic Trade Logistics',
        thumbnail: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400',
        status: 'ORBITING',
        studentsCount: 6100,
        rating: 4.7,
    },
];

/**
 * Dashboard Service Object
 */
const dashboardService = {
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>}
     */
    getStatistics: async () => {
        // Simulate API delay
        await delay(300);

        // When API is ready, uncomment:
        // return api.get('/admin/dashboard/statistics');

        return fakeStatistics;
    },

    /**
     * Get revenue chart data
     * @param {string} period - 'quarterly' | 'yearly' | 'max'
     * @returns {Promise<Object>}
     */
    getRevenueChart: async (period = 'quarterly') => {
        await delay(200);

        // When API is ready, uncomment:
        // return api.get(`/admin/dashboard/revenue?period=${period}`);

        return fakeRevenueData[period] || fakeRevenueData.quarterly;
    },

    /**
     * Get courses list for dashboard
     * @param {Object} params - Query parameters
     * @param {number} params.limit - Number of courses to fetch
     * @returns {Promise<Array>}
     */
    getCourses: async ({ limit = 3 } = {}) => {
        await delay(250);

        // When API is ready, uncomment:
        // return api.get(`/admin/dashboard/courses?limit=${limit}`);

        return fakeCourses.slice(0, limit);
    },

    /**
     * Export dashboard report to Excel
     * @param {Object} params - Report parameters
     * @returns {Promise<Blob>}
     */
    exportReport: async (params = {}) => {
        await delay(500);

        // When API is ready, implement actual file download:
        // const response = await fetch(`${API_BASE_URL}/admin/dashboard/export`, {
        //   method: 'POST',
        //   headers: createAuthHeaders(),
        //   body: JSON.stringify(params),
        // });
        // return response.blob();

        // For now, just return success
        return { success: true, message: 'Report generated' };
    },
};

export default dashboardService;
