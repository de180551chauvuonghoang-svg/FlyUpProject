import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { staggerContainer, staggerItem } from '../utils/animations';

// Course benefits data
const BENEFITS = [
  {
    icon: 'all_inclusive',
    title: 'Lifetime Access',
    description: 'Learn at your own pace with unlimited access to all course materials',
    color: 'primary'
  },
  {
    icon: 'workspace_premium',
    title: 'Certificates',
    description: 'Earn recognized certificates to showcase on LinkedIn and your resume',
    color: 'cyan'
  },
  {
    icon: 'groups',
    title: 'Community Support',
    description: 'Join a vibrant community of learners and get help when you need it',
    color: 'purple'
  },
  {
    icon: 'construction',
    title: 'Project-Based Learning',
    description: 'Build real-world projects to add to your professional portfolio',
    color: 'orange'
  },
  {
    icon: 'work',
    title: 'Career Guidance',
    description: 'Get expert advice on career paths, interviews, and job opportunities',
    color: 'green'
  },
  {
    icon: 'update',
    title: 'Regular Updates',
    description: 'Course content is regularly updated to reflect industry changes',
    color: 'blue'
  },
];

// Benefit Card Component
const BenefitCard = ({ benefit }) => {
  const { ref } = useScrollAnimation();
  
  const colorMap = {
    primary: 'text-primary bg-primary/20',
    cyan: 'text-cyan-400 bg-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/20',
    green: 'text-green-400 bg-green-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
  };

  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      className="group"
    >
      <div className="relative p-6 rounded-2xl bg-[#16161e] border border-[#2a2a3a] hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl ${colorMap[benefit.color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <span className="material-symbols-outlined text-3xl">{benefit.icon}</span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
          {benefit.title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {benefit.description}
        </p>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
};

// Course Benefits Section Component
const CourseBenefitsSection = () => {
  const { ref } = useScrollAnimation();

  return (
    <section className="px-4 md:px-10 py-16">
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
            What You'll <span className="text-primary">Get</span>
          </motion.h2>
          <motion.p variants={staggerItem} className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every course comes packed with features designed to accelerate your learning journey
          </motion.p>
        </div>

        {/* Benefits grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((benefit, index) => (
            <BenefitCard key={index} benefit={benefit} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div variants={staggerItem} className="text-center mt-12">
          <button className="px-8 py-4 rounded-full bg-primary text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all hover:-translate-y-1">
            Explore All Courses
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CourseBenefitsSection;
