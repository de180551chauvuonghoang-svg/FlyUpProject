import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { fetchCourses } from '../services/courseService';
import { getImageUrl } from '../utils/imageUtils';

// Hardcoded images for student avatars (keeping consistent with original design)
const STUDENT_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCTE_0chPEGpJYTZuDu2mDF8EbH6surjeQmKGbaQpRAQmZolc0u61Ujv_U49mK8OpX9VzqGSDQP1m8zQLFtaG-RnS9szE8571FQ84vshXoUd1ViqiiKSUn8fqujbmqocHPM7RZ8QS0opDVoIQ-jM29iyUYOGPZAO01KQAPIlpHgwpc7J9Lfv7NdMUhKKHd15YEgbUGa1HCrGK-NjDsATjrh-nnBIl7mF_RKUTFOG5EuwR-kc-xYuxHBt9Bj-j8IUzOGAp9Rp9srg2Q",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKXnpAvqQK2jJS--RRDv5jIMlzVheVdyDcXslHVcU2203bPRW5CKLPy1yBBWl_i43pMU-H3OoO17LYvtSNc8fSd5nCyVZWjYHgwNgythVbHsYuU1L1KB6UmHh6nbkntT0ojqkAjXm82OBS-sSK4muzUxaCZM4Fmqh9C0KZC6UTcs0fI08llhEV1U7LLJ6SQYPus4K565vkn7uvsi2viW-32dwTnKyMD-qt3lGaPNa0djlJT_z4_xgOYyyYyIr-xPFECgjTQTAMXkU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA6mnzLbtRlv2p_u4nIV9fldGyk0pMMd1BNV9GMJNV3qujerYIeEq6Y_Iy13cZ_K0VIqSevDt-5d4DGK5IC2NETa3QJfXJXE2Zs2bCktJ9VqkLAjWHdllFsIB5k2X919bVDclJrEIl2bF28BXkcCjPmB7RQJ29HiPivr42_KyaJiIczcs9pSEGPClDTO89AG_EjHSapWX7bR3NDFx4t5coCungHK8T7PL1nqwGldsc-XDmZijKnL46wdgN5mBFgS-tiqBNe1cEEu60"
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch courses for the slideshow
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['heroCourses'],
    queryFn: () => fetchCourses({ page: 1, limit: 5 }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const courses = coursesData?.courses || [];

  // Cycle through slides
  useEffect(() => {
    if (courses.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % courses.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [courses.length]);

  const currentCourse = courses[currentSlide];

  return (
    <section className="px-4 md:px-10 py-12 lg:py-20">
      <div className="@container">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left Content */}
          <div className="flex flex-col gap-6 lg:w-1/2 items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              New Courses Added Weekly
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight">
              Unlock Your Potential with <span className="text-primary">Expert-Led</span> Courses
            </h1>
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Master new skills in design, coding, business, and more. Learn from industry leaders and start building your future today with our comprehensive curriculum.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => navigate('/courses')}
                className="h-12 px-8 rounded-full bg-primary text-white font-bold text-base hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2 transform hover:-translate-y-1"
              >
                Start Learning
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
              <button 
                onClick={() => navigate('/courses')}
                className="h-12 px-8 rounded-full bg-[#16161e] border border-[#2a2a3a] text-white font-bold text-base hover:bg-[#1e1e28] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">grid_view</span>
                Browse Courses
              </button>
            </div>
            <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
              <div className="flex -space-x-3">
                {STUDENT_IMAGES.map((img, i) => (
                  <img key={i} alt="Student portrait" className="w-10 h-10 rounded-full border-2 border-[#0a0a14]" src={img}/>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[#0a0a14] bg-[#16161e] flex items-center justify-center text-xs font-bold text-white">
                  +2k
                </div>
              </div>
              <p>Join over 2,000+ happy students</p>
            </div>
          </div>

          {/* Right Slideshow Area */}
          <div className="lg:w-1/2 w-full relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-50"></div>
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-[#16161e] group">
              
              {/* Slideshow Images */}
              <AnimatePresence mode="popLayout">
                {currentCourse && (
                  <Motion.div
                    key={currentCourse.id}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${getImageUrl(currentCourse.image)}")` }}
                  />
                )}
                {/* Fallback/Loading State if no courses */}
                 {!currentCourse && !isLoading && (
                    <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBdVIP9ci5W3JDSF0ynyZ8un4p6elYAKnk8sVDb6tDVuDFsemmfG8-I74wwniUDziY6DSOY0zopCOR2JYhin-pmKV4nJ0Cre4_nB4cVL63TRRiinJXedkaXUJuF-XyVsYALnUI8j1-LOM2Gkyx2g1gXFR0m91Vt0lzgLay54YkDmPNHcKRnFSw4RepryP2vTZctf9eLxlhqZCITVle6v3Armek7xsOeaGINxa-Jh-w8v5NA0aSXF5opW9Y3OWNX1a_oMvgjMEC5E0I")`}}></div>
                 )}
              </AnimatePresence>
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#16161e] via-transparent to-transparent opacity-60"></div>

              {/* Course Info Card Overlay */}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center gap-4 text-white hover:bg-white/15 transition-colors cursor-pointer"
                   onClick={() => currentCourse && navigate(`/courses/${currentCourse.id}`)}
              >
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-2xl">play_circle</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm opacity-80 mb-0.5">Featured Course</div>
                  <Motion.div 
                    key={currentCourse ? currentCourse.id : 'loading'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-bold truncate"
                  >
                    {currentCourse ? currentCourse.title : "Loading Courses..."}
                  </Motion.div>
                  {/* Progress bar simulation */}
                  <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                    <Motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                        className="bg-primary h-full rounded-full"
                    ></Motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
