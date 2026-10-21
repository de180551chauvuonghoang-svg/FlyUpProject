/**
 * System Health Helper
 * Provides runtime metrics for server health checks and CD verification
 */
export const getSystemHealth = () => {
  const memoryUsage = process.memoryUsage();
  return {
    status: 'ok',
    message: 'FlyUp Backend is running smoothly',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rss: `${Math.round(memoryUsage.rss / (1024 * 1024))}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / (1024 * 1024))}MB`,
    },
  };
};
