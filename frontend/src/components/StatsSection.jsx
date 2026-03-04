import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useCounter, formatNumber } from '../hooks/useCounter';
import { fadeIn, staggerContainer, staggerItem } from '../utils/animations';

// Stats data
const STATS = [
  { value: 10000, label: 'Active Students', icon: 'school', color: 'text-primary' },
  { value: 500, label: 'Expert Courses', icon: 'menu_book', color: 'text-cyan-400' },
  { value: 100, label: 'Top Instructors', icon: 'workspace_premium', color: 'text-orange-400' },
  { value: 95, label: 'Success Rate', icon: 'trending_up', color: 'text-green-400', suffix: '%' },
];

// Stat Card Component
const StatCard = ({ stat }) => {
  const { ref, isInView } = useScrollAnimation();
  const count = useCounter(stat.value, 2000, isInView);
  
  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      className="relative group"
    >
      <div className="relative p-6 rounded-2xl bg-[#16161e] border border-[#2a2a3a] hover:border-primary/50 transition-all overflow-hidden">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className={`w-14 h-14 rounded-full bg-${stat.color.split('-')[1]}-500/20 flex items-center justify-center ${stat.color}`}>
            <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
          </div>
          
          <div>
            <div className="text-4xl font-black text-white mb-1">
              {stat.suffix ? `${count}${stat.suffix}` : formatNumber(count)}
              {!isInView && stat.suffix && stat.suffix}
            </div>
            <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
          </div>
        </div>

        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
};

// Stats Section Component
const StatsSection = () => {
  const { ref } = useScrollAnimation();

  return (
    <section className="px-4 md:px-10 py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative z-10 max-w-6xl mx-auto"
      >
        {/* Section header */}
        <motion.div variants={fadeIn} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Join Our Growing <span className="text-primary">Community</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Thousands of students are already learning and achieving their goals with FlyUp
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, index) => (
            <StatCard key={index} stat={stat} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default StatsSection;
