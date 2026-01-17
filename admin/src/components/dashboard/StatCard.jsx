import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '../../utils/formatters';

/**
 * StatCard Component
 * Displays a single statistic with icon, value, trend
 */
function StatCard({ icon: Icon, value, label, trend, isCurrency, suffix, delay = 0 }) {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  // Format the display value
  const displayValue = isCurrency 
    ? formatCurrency(value) 
    : typeof value === 'number' && value >= 1000 
      ? formatNumber(value) 
      : value;

  return (
    <motion.div 
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="stat-header">
        <div className="stat-icon">
          {Icon && <Icon size={22} />}
        </div>
        {trend !== undefined && (
          <div className={`stat-trend ${isPositive ? 'positive' : 'negative'}`}>
            <TrendIcon size={14} />
            <span>{formatPercentage(Math.abs(trend))}</span>
          </div>
        )}
      </div>
      
      <div className="stat-body">
        <div className="stat-value">
          {displayValue}
          {suffix && <span className="stat-suffix">{suffix}</span>}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </motion.div>
  );
}

export default StatCard;
