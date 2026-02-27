/**
 * Dashboard Service
 * Handles all dashboard-related API calls — connected to real backend API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const createAuthHeaders = () => {
  const token = localStorage.getItem('adminAccessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
};

/**
 * Format a number for display (e.g. 18420 -> "18.4K")
 */
const formatStatValue = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const dashboardService = {
  /**
   * Get dashboard statistics from real API
   * @returns {Promise<Object>}
   */
  getStatistics: async () => {
    const response = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    const data = await handleResponse(response);
    const s = data.stats;

    // Map to dashboard card format
    return {
      totalCadets: {
        value: s.totalLearners,
        trend: s.activeUsers > 0 ? parseFloat(((s.totalLearners / s.totalUsers) * 100).toFixed(1)) : 0,
        label: 'Total Learners',
      },
      creditsEarned: {
        value: s.totalRevenue,
        trend: s.recentEnrollments,
        label: 'Total Revenue',
        isCurrency: true,
      },
      fleetUnits: {
        value: s.totalCourses,
        trend: s.approvedCourses,
        label: 'Total Courses',
      },
      approvalRate: {
        value: s.averageRating,
        trend: s.totalRatingCount,
        label: 'Avg Rating',
        suffix: '/5',
      },
      // Extra data for dashboard use
      raw: s,
    };
  },

  /**
   * Get revenue chart data
   * @param {string} period - 'quarterly' | 'yearly' | 'max'
   * @returns {Promise<Object>}
   */
  getRevenueChart: async (period = 'quarterly') => {
    const params = new URLSearchParams({ period });
    const response = await fetch(`${API_URL}/admin/stats/chart?${params}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get courses list for dashboard (real API)
   * @param {Object} params
   * @param {number} params.limit - Number of courses
   * @returns {Promise<Array>}
   */
  getCourses: async ({ limit = 3 } = {}) => {
    const params = new URLSearchParams({
      page: '1',
      limit: limit.toString(),
      status: 'ALL',
    });

    const response = await fetch(`${API_URL}/admin/courses?${params}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    const data = await handleResponse(response);

    // Map to dashboard card format
    return (data.courses || []).map(course => ({
      id: course.id,
      title: course.title,
      thumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
      status: course.status,
      studentsCount: course.studentsCount || 0,
      rating: course.rating || 0,
    }));
  },

  /**
   * Export dashboard report as Excel file
   * @param {Object} rawStats - raw stats data from API
   */
  exportReport: async (rawStats) => {
    const XLSX = await import('xlsx');

    const wb = XLSX.utils.book_new();

    // Sheet 1: Dashboard Overview
    const overviewData = [
      ['FlyUp Admin Dashboard Report'],
      ['Generated at', new Date().toLocaleString()],
      [],
      ['=== USER STATISTICS ==='],
      ['Total Users', rawStats?.totalUsers || 0],
      ['Active Users', rawStats?.activeUsers || 0],
      ['Locked Users', rawStats?.lockedUsers || 0],
      ['Total Learners', rawStats?.totalLearners || 0],
      ['Total Instructors', rawStats?.totalInstructors || 0],
      [],
      ['=== COURSE STATISTICS ==='],
      ['Total Courses', rawStats?.totalCourses || 0],
      ['Approved Courses', rawStats?.approvedCourses || 0],
      ['Pending Courses', rawStats?.pendingCourses || 0],
      ['Rejected Courses', rawStats?.rejectedCourses || 0],
      [],
      ['=== ENROLLMENT & REVENUE ==='],
      ['Total Enrollments', rawStats?.totalEnrollments || 0],
      ['Recent Enrollments (30 days)', rawStats?.recentEnrollments || 0],
      ['Total Revenue', rawStats?.totalRevenue || 0],
      [],
      ['=== RATINGS ==='],
      ['Average Rating', rawStats?.averageRating || 0],
      ['Total Rating Count', rawStats?.totalRatingCount || 0],
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    wsOverview['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Dashboard Overview');

    // Sheet 2-4: Enrollment charts for each period
    const periods = ['monthly', 'quarterly', 'yearly'];
    const periodLabels = { monthly: 'Monthly (30 days)', quarterly: 'Quarterly (12 weeks)', yearly: 'Yearly (12 months)' };

    for (const period of periods) {
      try {
        const params = new URLSearchParams({ period });
        const response = await fetch(`${API_URL}/admin/stats/chart?${params}`, {
          method: 'GET',
          headers: createAuthHeaders(),
        });
        const chartData = await handleResponse(response);

        const sheetData = [
          [`Enrollment Data — ${periodLabels[period]}`],
          [],
          ['Period', 'Enrollments'],
          ...chartData.labels.map((label, i) => [label, chartData.data[i]]),
          [],
          ['Total', chartData.data.reduce((a, b) => a + b, 0)],
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = [{ wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, periodLabels[period].split(' (')[0]);
      } catch (err) {
        console.error(`Failed to fetch ${period} chart data:`, err);
      }
    }

    // Trigger download
    XLSX.writeFile(wb, `FlyUp_Dashboard_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },
};

export default dashboardService;
