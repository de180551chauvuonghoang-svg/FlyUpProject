import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { staggerContainer, staggerItem } from '../utils/animations';

// Learning paths data
const LEARNING_PATHS = [
  {
    title: 'Web Development',
    description: 'From HTML basics to full-stack mastery',
    icon: 'code',
    color: 'cyan',
    steps: ['Frontend Basics', 'Backend Development', 'Full Stack Projects'],
    duration: '6-8 months',
    level: 'Beginner to Advanced'
  },
  {
    title: 'UI/UX Design',
    description: 'Create beautiful and functional interfaces',
    icon: 'palette',
    color: 'purple',
    steps: ['Design Principles', 'Figma Mastery', 'Portfolio Building'],
    duration: '4-6 months',
    level: 'Beginner to Pro'
  },
  {
    title: 'Digital Marketing',
    description: 'Master SEO, social media, and analytics',
    icon: 'campaign',
    color: 'orange',
    steps: ['SEO Fundamentals', 'Social Media', 'Analytics \u0026 ROI'],
    duration: '3-5 months',
    level: 'All Levels'
  },
  {
    title: 'Business Strategy',
    description: 'Build and scale your own business',
    icon: 'trending_up',
    color: 'green',
    steps: ['Business Planning', 'Growth Strategies', 'Leadership'],
    duration: '5-7 months',
    level: 'Intermediate'
  },
];

// Learning Path Card Component
const PathCard = ({ path }) => {
  const { ref } = useScrollAnimation();
  
  const colorClasses = {
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-500/5',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'group-hover:shadow-cyan-500/20'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-500/5',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'group-hover:shadow-purple-500/20'
    },
    orange: {
      bg: 'from-orange-500/20 to-orange-500/5',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      glow: 'group-hover:shadow-orange-500/20'
    },
    green: {
      bg: 'from-green-500/20 to-green-500/5',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'group-hover:shadow-green-500/20'
    },
  };

  const colors = colorClasses[path.color];

  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      className="group relative"
    >
      <div className={`relative p-6 rounded-2xl bg-[#16161e] border ${colors.border} hover:border-${path.color}-500/50 transition-all duration-300 ${colors.glow} hover:shadow-xl overflow-hidden`}>
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Icon and title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-${path.color}-500/20 flex items-center justify-center ${colors.text} flex-shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{path.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{path.title}</h3>
              <p className="text-sm text-gray-400">{path.description}</p>
            </div>
          </div>

          {/* Learning steps */}
          <div className="space-y-2 mb-4">
            {path.steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                <span className="text-gray-300">{step}</span>
              </div>
            ))}
          </div>

          {/* Meta info */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2a2a3a]">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {path.duration}
            </div>
            <div className={`text-xs font-bold ${colors.text}`}>
              {path.level}
            </div>
          </div>

          {/* CTA */}
          <button className={`mt-4 w-full py-2.5 rounded-lg bg-${path.color}-500/10 ${colors.text} font-bold text-sm hover:bg-${path.color}-500/20 transition-all`}>
            Start Learning Path
          </button>
        </div>

        {/* Decorative element */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
};

// Learning Paths Section Component
const LearningPathsSection = () => {
  const { ref } = useScrollAnimation();

  return (
    <section className="px-4 md:px-10 py-16 bg-[#0d0d16]">
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="max-w-7xl mx-auto"
      >
        {/* Section header */}
        <div className="text-center mb-12">
          <motion.h2 variants={staggerItem} className="text-3xl md:text-4xl font-black text-white mb-4">
            Choose Your <span className="text-primary">Learning Path</span>
          </motion.h2>
          <motion.p variants={staggerItem} className="text-gray-400 text-lg max-w-2xl mx-auto">
            Structured roadmaps to guide you from beginner to expert in your chosen field
          </motion.p>
        </div>

        {/* Paths grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {LEARNING_PATHS.map((path, index) => (
            <PathCard key={index} path={path} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default LearningPathsSection;
