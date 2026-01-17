import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Download, Users, CreditCard, Ship, Star } from 'lucide-react';

import StatCard from '../../components/dashboard/StatCard';
import EarningPulse from '../../components/dashboard/EarningPulse';
import CourseCard from '../../components/dashboard/CourseCard';
import dashboardService from '../../services/dashboardService';

/**
 * Dashboard Page
 * Main admin dashboard with statistics, charts, and courses
 */
function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [stats, revenue, coursesData] = await Promise.all([
          dashboardService.getStatistics(),
          dashboardService.getRevenueChart('quarterly'),
          dashboardService.getCourses({ limit: 3 }),
        ]);
        
        setStatistics(stats);
        setRevenueData(revenue);
        setCourses(coursesData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle period change for chart
  const handlePeriodChange = async (period) => {
    try {
      setChartLoading(true);
      const data = await dashboardService.getRevenueChart(period);
      setRevenueData(data);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  // Handle export report
  const handleExportReport = async () => {
    try {
      await dashboardService.exportReport();
      // In real implementation, this would trigger file download
      alert('Report exported successfully!');
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  // Stat cards configuration
  const statCards = statistics ? [
    {
      icon: Users,
      ...statistics.totalCadets,
    },
    {
      icon: CreditCard,
      ...statistics.creditsEarned,
    },
    {
      icon: Ship,
      ...statistics.fleetUnits,
    },
    {
      icon: Star,
      ...statistics.approvalRate,
    },
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
            <p className="page-subtitle">
              Awaiting commands. Your galactic learning empire is expanding at 1.4x light speed.
            </p>
          </motion.div>
        </div>
        
        <div className="header-right">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Scan records..." />
          </div>
          <button className="notification-btn">
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>
        </div>
      </header>

      {/* Statistics Cards */}
      <section className="stats-section">
        <div className="stats-grid">
          {isLoading ? (
            // Loading skeletons
            [...Array(4)].map((_, i) => (
              <div key={i} className="stat-card skeleton">
                <div className="skeleton-icon"></div>
                <div className="skeleton-value"></div>
                <div className="skeleton-label"></div>
              </div>
            ))
          ) : (
            statCards.map((stat, index) => (
              <StatCard
                key={stat.label}
                {...stat}
                delay={index * 0.1}
              />
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

      {/* Course Command Section */}
      <section className="courses-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Course Command</h2>
            <p className="section-subtitle">Deploy and monitor active educational modules</p>
          </div>
          <button className="export-btn" onClick={handleExportReport}>
            <Download size={16} />
            <span>Export Fleet</span>
          </button>
        </div>
        
        <div className="courses-grid">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="course-card skeleton">
                <div className="skeleton-thumbnail"></div>
                <div className="skeleton-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-stats"></div>
                </div>
              </div>
            ))
          ) : (
            courses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                delay={0.5 + index * 0.1}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
