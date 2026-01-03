import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Rocket, ChevronRight, Star, StarHalf, Clock, Globe, Video, 
  FileDown, Infinity as InfinityIcon, Smartphone, Award, Check, ChevronDown, 
  Play, Users, PlayCircle 
} from 'lucide-react';
import { 
  staggerContainer, 
  staggerItem
} from '../utils/animations';
import Header from '../components/Header/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to resolve image URLs
const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/public/${cleanPath}`;
};

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({});

  // React Query for caching
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/courses/${courseId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Course not found');
        throw new Error('Failed to fetch course');
      }
      const json = await response.json();
      if (json.success && json.data) return json.data;
      throw new Error('Invalid course data');
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  const course = data || null;
  const loading = isLoading;
  const error = queryError?.message || null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper function to format price in Vietnamese
  const formatVNPrice = (price) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString('vi-VN');
  };

  // Memoized helper to calculate rating
  const rating = course ? (
    course.RatingCount && course.RatingCount > 0
      ? (Number(course.TotalRating) / course.RatingCount).toFixed(1)
      : 0
  ) : 0;

  // Memoized helper to calculate discount percentage
  const discount = course && course.Discount ? Math.round(parseFloat(course.Discount)) : 0;

  // Skeleton Loading state with better UX
  if (loading) {
    return (
      <div className="bg-[#0D071E] text-white font-display overflow-x-hidden min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8 lg:gap-10">
          {/* Left Column Skeleton */}
          <div className="flex flex-col min-w-0 space-y-6">
            {/* Breadcrumb skeleton */}
            <div className="flex gap-2 items-center">
              <div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-white/5 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-white/5 rounded animate-pulse"></div>
            </div>
            
            {/* Title skeleton */}
            <div>
              <div className="h-10 w-3/4 bg-white/5 rounded animate-pulse mb-4"></div>
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Video skeleton */}
            <div className="w-full aspect-video rounded-xl bg-white/5 animate-pulse"></div>
            
            {/* Content skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-48 bg-white/5 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Right Column Skeleton */}
          <div className="sticky top-24">
            <div className="bg-[#1A1333] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="h-12 w-40 bg-white/5 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-white/5 rounded-full animate-pulse"></div>
              <div className="h-12 w-full bg-white/5 rounded-full animate-pulse"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#0D071E] text-white font-display overflow-x-hidden min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 lg:p-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/courses')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:shadow-lg transition-all"
            >
              Back to Courses
            </button>
          </div>
        </main>
      </div>
    );
  }

  // No course data
  if (!course) {
    return null;
  }

  // Extract data from backend format
  // Handle Instructors being an array from Prisma relation
  const instructor = Array.isArray(course.Instructors) 
    ? course.Instructors[0]?.Users_Instructors_CreatorIdToUsers 
    : course.Instructors?.Users_Instructors_CreatorIdToUsers || {};
  
  const category = course.Categories?.Title || 'Uncategorized';

  return (
    <div className="bg-[#0D071E] text-white font-display overflow-x-hidden min-h-screen flex flex-col antialiased">
      <Header />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8 lg:gap-10">
        {/* Left Column */}
        <div className="flex flex-col min-w-0">
          {/* Breadcrumb - Simplified animation */}
          <div className="flex flex-wrap gap-2 items-center mb-6">
            <a className="text-slate-400 hover:text-violet-400 text-sm font-medium transition-colors" href="/">Home</a>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <a className="text-slate-400 hover:text-violet-400 text-sm font-medium transition-colors" href="/courses">Courses</a>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-violet-400 text-sm font-medium">{category}</span>
          </div>

          {/* Course Title - Simplified */}
          <div className="mb-8">
            <h1 className="text-white text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-4" style={{ textShadow: '0 0 20px rgba(167, 139, 250, 0.4)' }}>
              {course.Title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="font-bold text-white mr-1">{rating || '0'}</span>
                <Star className="w-4 h-4 fill-current text-yellow-500" />
                <span className="text-slate-400 ml-1">({course.RatingCount || 0} ratings)</span>
              </div>
              <span className="hidden sm:inline text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Last updated {new Date(course.UpdateTime || course.CreationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              <span className="hidden sm:inline text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>{course.Level || 'All Levels'}</span>
              </div>
            </div>
          </div>

          {/* Video Preview - Lazy loaded */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group mb-10 shadow-2xl shadow-violet-900/10 hover:scale-[1.01] transition-transform">
            <img 
              src={course.ThumbUrl || 'https://via.placeholder.com/800x450'}
              alt={course.Title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="flex items-center justify-center size-20 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/40 hover:scale-110 transition-all duration-300">
                <Play className="w-8 h-8 fill-current ml-1" />
              </button>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/10">
                Preview Course
              </div>
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/10">
                02:14
              </div>
            </div>
          </div>

          {/* Tabs - Simplified */}
          <div className="border-b border-white/10 mb-8">
            <nav aria-label="Tabs" className="flex space-x-8 min-w-max overflow-x-auto pb-px">
              {['Overview', 'Curriculum', 'Instructor', 'Reviews'].map((tab, index) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.toLowerCase()
                      ? 'border-violet-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab}
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-10">
            {/* What you'll learn - Simplified */}
            <div className="bg-[#1A1333] border border-white/5 rounded-2xl p-6 lg:p-8">
              <h3 className="text-xl font-bold text-white mb-6">What you'll learn</h3>
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {(course.Description || course.Intro || '').split('.').filter(item => item.trim()).slice(0, 6).map((item, index) => (
                  <motion.div 
                    key={index} 
                    variants={staggerItem}
                    className="flex gap-3 items-start"
                  >
                    <Check className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{item.trim()}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Description - Simplified */}
            <div className="text-slate-300 leading-relaxed space-y-4">
              <h3 className="text-xl font-bold text-white mb-2">Description</h3>
              <p>{course.Intro}</p>
              {course.Description && <p className="mt-4">{course.Description}</p>}
            </div>

            {/* Course Content - Simplified */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Course Content</h3>
              <div className="rounded-xl border border-white/5 overflow-hidden">
                {(course.Sections && course.Sections.length > 0) ? (
                  course.Sections.map((section, index) => (
                    <motion.div 
                      key={section.Id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className={`bg-[#1A1333] ${index !== course.Sections.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <motion.button
                        onClick={() => toggleSection(section.Id)}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        className="w-full flex items-center justify-between p-4 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSections[section.Id] ? (
                            <ChevronDown className="w-5 h-5 text-violet-400 group-hover:text-white transition-colors" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                          )}
                          <span className="font-semibold text-white">{section.Title}</span>
                        </div>
                        <span className="text-sm text-slate-400">{section.Lectures?.length || 0} lectures</span>
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-[#1A1333] p-4 text-center text-slate-400">
                    No curriculum available yet
                  </div>
                )}
              </div>
            </div>

            {/* Instructor - Lazy loaded avatar */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Instructor</h3>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#1A1333] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="size-20 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/20"
                >
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Portrait of instructor" 
                    src={getImageUrl(instructor.AvatarUrl) || 'https://via.placeholder.com/100?text=Instructor'}
                    loading="lazy"
                  />
                </motion.div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">{instructor.FullName || 'Unknown Instructor'}</h4>
                  <p className="text-violet-400 text-sm mb-3 font-medium">Instructor</p>
                  <div className="flex gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" /> {rating} Rating
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />{course.LearnerCount || 0} Students
                    </span>
                    <span className="flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5" /> {course.Sections?.length || 0} Sections
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {course.Description || 'Professional instructor with years of experience.'}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar - Simplified */}
        <div className="relative">
          <motion.div 
            whileHover={{ y: -4 }}
            className="sticky top-24 bg-[#1A1333] border border-white/5 rounded-2xl p-6 shadow-xl shadow-black/40"
          >
            {/* Pricing */}
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-white">{formatVNPrice(course.Price)}₫</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-slate-500 line-through mb-1.5">
                    {formatVNPrice(parseFloat(course.Price) / (1 - discount / 100))}₫
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-500 text-sm font-bold mb-2 ml-auto border border-pink-500/20">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-6 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              <Clock className="w-4 h-4" />
              <span>5 hours left at this price!</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{ 
                  boxShadow: [
                    '0 10px 30px rgba(168, 85, 247, 0.3)',
                    '0 10px 40px rgba(168, 85, 247, 0.5)',
                    '0 10px 30px rgba(168, 85, 247, 0.3)'
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-full h-12 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 flex items-center justify-center gap-2"
              >
                Add to Cart
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 rounded-full bg-transparent border border-white/20 text-white font-bold text-base transition-colors"
              >
                Buy Now
              </motion.button>
            </div>

            {/* Money-back guarantee */}
            <div className="text-center text-xs text-slate-400 mb-6">
              30-Day Money-Back Guarantee
            </div>

            {/* Course Includes */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h4 className="font-bold text-white text-sm">This course includes:</h4>
              <ul className="space-y-3">
                {[
                  { icon: Video, text: `${course.LectureCount || 0} lectures on-demand` },
                  { icon: FileDown, text: `Level: ${course.Level || 'All'}` },
                  { icon: InfinityIcon, text: 'Full lifetime access' },
                  { icon: Smartphone, text: 'Access on mobile and TV' },
                  { icon: Award, text: 'Certificate of completion' }
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-slate-400">
                    <item.icon className="w-4 h-4 text-violet-400 shrink-0" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Links */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center px-1">
              <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Share</button>
              <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Gift course</button>
              <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Coupons</button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 bg-[#1A1333] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Rocket className="w-5 h-5 text-violet-400" />
            <span className="font-bold tracking-tight">Cosmos Learn</span>
          </div>
          <p className="text-slate-400 text-sm">© 2024 Cosmos Learn Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
