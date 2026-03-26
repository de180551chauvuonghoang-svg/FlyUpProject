/**
 * Dashboard Service
 * Handles all dashboard-related API calls — connected to real backend API
 * Uses shared fetchWithAuth for automatic token refresh
 */

import { API_BASE_URL, fetchWithAuth, createAuthHeaders } from './api';

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
    const data = await fetchWithAuth(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
    });
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
   * @param {string|Object} options - period string OR object { period, year, month }
   * @returns {Promise<Object>}
   */
  getRevenueChart: async (options = 'monthly') => {
    const params = new URLSearchParams(
      typeof options === 'object' ? options : { period: options }
    );
    return fetchWithAuth(`${API_BASE_URL}/admin/stats/chart?${params}`, {
      method: 'GET',
    });
  },

  /**
   * Get transactions with pagination for dashboard
   * @param {Object} params
   * @param {number} params.page - Current page
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>}
   */
  getRecentTransactions: async ({ page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return fetchWithAuth(`${API_BASE_URL}/admin/stats/recent-transactions?${params}`, {
      method: 'GET',
    });
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
        const chartData = await fetchWithAuth(`${API_BASE_URL}/admin/stats/chart?period=${period}`, {
          method: 'GET',
        });

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
