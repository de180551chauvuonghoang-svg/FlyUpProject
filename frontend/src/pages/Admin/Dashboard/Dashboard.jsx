import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Download, Users, CreditCard, Ship, Star,
  Receipt, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';

import StatCard from '../../../components/Admin/dashboard/StatCard';
import EarningPulse from '../../../components/Admin/dashboard/EarningPulse';
import dashboardService from '../../../services/admin/dashboardService';
import { formatDate, formatCurrency } from '../../../utils/admin/formatters';

/**
 * Dashboard Page
 * Main admin dashboard with statistics, charts, and recent transactions
 */
function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [txPagination, setTxPagination] = useState(null);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch dashboard stats + chart on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [stats, revenue] = await Promise.all([
          dashboardService.getStatistics(),
          dashboardService.getRevenueChart('quarterly'),
        ]);
        setStatistics(stats);
        setRevenueData(revenue);
      } catch (error) {
        toast.error('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch transactions (paginated)
  const fetchTransactions = async (page = 1) => {
    try {
      setTxLoading(true);
      const result = await dashboardService.getRecentTransactions({ page, limit: 10 });
      setRecentTx(result.transactions || []);
      setTxPagination(result.pagination || null);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(txPage);
  }, [txPage]);

  // Handle period change for chart
  const handlePeriodChange = async (period) => {
    try {
      setChartLoading(true);
      const data = await dashboardService.getRevenueChart(period);
      setRevenueData(data);
    } catch (error) {
      toast.error('Failed to fetch revenue data');
    } finally {
      setChartLoading(false);
    }
  };

  // Handle export report
  const handleExportReport = async () => {
    try {
      await dashboardService.exportReport(statistics?.raw);
      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  // Stat cards configuration
  const statCards = statistics ? [
    { icon: Users, ...statistics.totalCadets },
    { icon: CreditCard, ...statistics.creditsEarned },
    { icon: Ship, ...statistics.fleetUnits },
    { icon: Star, ...statistics.approvalRate },
  ] : [];

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="page-title">
              <span className="title-accent">System</span>
              <span className="title-main">Overview</span>
            </h1>
          </motion.div>
        </div>
      </header>

      {/* Statistics Cards */}
      <section className="stats-section">
        <div className="stats-grid">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="stat-card skeleton">
                <div className="skeleton-icon"></div>
                <div className="skeleton-value"></div>
                <div className="skeleton-label"></div>
              </div>
            ))
          ) : (
            statCards.map((stat, index) => (
              <StatCard key={stat.label} {...stat} delay={index * 0.1} />
            ))
          )}
        </div>
      </section>

      {/* Earning Pulse Chart */}
      <section className="chart-section">
        <EarningPulse 
          data={revenueData}
          isLoading={chartLoading}
          onPeriodChange={handlePeriodChange}
        />
      </section>

      {/* Recent Transactions Section */}
      <motion.section
        className="dashboard-tx-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="dashboard-tx-header">
          <div className="dashboard-tx-title-row">
            <Receipt size={18} className="dashboard-tx-icon" />
            <h2 className="section-title" style={{ margin: 0 }}>Recent Transactions</h2>
            {txPagination && (
              <span className="dashboard-tx-count">
                {txPagination.totalItems} total
              </span>
            )}
          </div>
          <button className="export-btn" onClick={handleExportReport}>
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>

        {txLoading ? (
          <div className="dashboard-tx-loading">
            <div className="dashboard-tx-skeleton-row" />
            <div className="dashboard-tx-skeleton-row" />
            <div className="dashboard-tx-skeleton-row" />
          </div>
        ) : recentTx.length === 0 ? (
          <div className="dashboard-tx-empty">
            <Receipt size={36} />
            <p>No transactions yet</p>
          </div>
        ) : (
          <>
            <div className="dashboard-tx-table-wrap">
              <table className="dashboard-tx-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Courses</th>
                    <th>Amount</th>
                    <th>Gateway</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx) => (
                    <tr key={tx.id} className="dashboard-tx-row">
                      <td>
                        <div className="dashboard-tx-user">
                          <img
                            src={tx.user?.avatar}
                            alt={tx.user?.fullName}
                            className="dashboard-tx-avatar"
                          />
                          <div>
                            <span className="dashboard-tx-username">{tx.user?.fullName}</span>
                            <span className="dashboard-tx-email">{tx.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="dashboard-tx-courses">
                          {tx.courses?.length > 0
                            ? tx.courses.map(c => (
                                <span key={c.id} className="dashboard-tx-course-tag">{c.title}</span>
                              ))
                            : <span className="dashboard-tx-no-course">—</span>
                          }
                        </div>
                      </td>
                      <td className="dashboard-tx-amount">{formatCurrency(tx.amount)}</td>
                      <td>
                        <span className="dashboard-tx-gateway">{tx.gateway}</span>
                      </td>
                      <td className="dashboard-tx-date">{formatDate(tx.createdAt)}</td>
                      <td>
                        <span className={`dashboard-tx-status ${tx.isSuccessful ? 'success' : 'failed'}`}>
                          {tx.isSuccessful
                            ? <><CheckCircle2 size={12} /> Success</>
                            : <><AlertCircle size={12} /> Failed</>
                          }
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {txPagination && txPagination.totalPages > 1 && (
              <div className="dashboard-tx-pagination">
                <button
                  className="dashboard-tx-page-btn"
                  disabled={!txPagination.hasPrevPage}
                  onClick={() => setTxPage(p => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>

                {(() => {
                  const total = txPagination.totalPages;
                  const current = txPagination.currentPage;
                  let start = Math.max(1, current - 2);
                  let end = Math.min(total, start + 4);
                  if (end - start < 4) start = Math.max(1, end - 4);
                  const pages = [];
                  for (let i = start; i <= end; i++) pages.push(i);
                  return pages.map(p => (
                    <button
                      key={p}
                      className={`dashboard-tx-page-num ${p === current ? 'active' : ''}`}
                      onClick={() => setTxPage(p)}
                    >
                      {p}
                    </button>
                  ));
                })()}

                <button
                  className="dashboard-tx-page-btn"
                  disabled={!txPagination.hasNextPage}
                  onClick={() => setTxPage(p => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </motion.section>
    </div>
  );
}

export default Dashboard;
