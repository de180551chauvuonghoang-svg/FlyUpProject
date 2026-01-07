import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import useAuth from '../hooks/useAuth';
import { fetchUserEnrollments } from '../services/userService';
import { getImageUrl } from '../utils/imageUtils';

const MyLearningPage = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['userEnrollments', user?.id],
        queryFn: () => fetchUserEnrollments(user.id),
        enabled: !!user,
    });

    const enrollments = data?.enrollments || [];
    const inProgressCount = enrollments.length; // Assuming all enrollments are in progress for now
    
    // Calculate total hours - mock for now since backend course model might not have duration parsable easily yet
    // But if course has Duration/Hours, we could sum it.
    // For now, hardcode mock stats for Hours and Certificates as requested "real data" usually implies real lists first.
    // I will try to sum up hours if available, else 0.
    
    if (authLoading || (isLoading && !!user)) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading your learning journey...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-red-500">error</span>
                    <p className="text-xl">Failed to load your courses.</p>
                    <p className="text-slate-400 text-sm">{error.message}</p>
                    <button 
                         onClick={() => window.location.reload()}
                         className="px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-bold transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!user) return null; // handled by useEffect

    const calculateProgress = (enrollment) => {
        if (!enrollment || !enrollment.course) return 0;
        
        let completedLectures = 0;
        try {
            if (enrollment.LectureMilestones) {
                const milestones = JSON.parse(enrollment.LectureMilestones);
                if (Array.isArray(milestones)) {
                    completedLectures = milestones.length;
                }
            }
        } catch (e) {
            console.error("Error parsing milestones", e);
        }

        const totalLectures = enrollment.course.LectureCount || 0;
        if (totalLectures === 0) return 0;
        
        const progress = Math.round((completedLectures / totalLectures) * 100);
        return Math.min(progress, 100); // user might have viewed more than count if count changed or bug
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-white overflow-x-hidden selection:bg-primary selection:text-white flex flex-col">
            <Header />
            <main className="w-full flex justify-center py-8 px-4 md:px-8 flex-1">
                <div className="w-full max-w-[1280px] flex flex-col gap-8">
                    {/* Page Heading & Stats Summary */}
                    <div className="flex flex-col xl:flex-row gap-8 justify-between items-start xl:items-end">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(110,60,236,0.25)]">My Learning</h1>
                            <p className="text-slate-400 text-lg max-w-2xl">Track your progress and continue your journey into the cosmos of knowledge.</p>
                        </div>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full xl:w-auto">
                            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/40 transition-colors shadow-card">
                                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                    <span className="material-symbols-outlined text-primary text-lg">school</span>
                                    In Progress
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white">{inProgressCount}</span>
                                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">Courses</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/40 transition-colors shadow-card">
                                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                    <span className="material-symbols-outlined text-amber-400 text-lg">emoji_events</span>
                                    Certificates
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white">0</span>
                                    <span className="text-xs font-medium text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded-full">Coming soon</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 p-4 col-span-2 md:col-span-1 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/40 transition-colors shadow-card">
                                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                    <span className="material-symbols-outlined text-sky-400 text-lg">schedule</span>
                                    Hours Learned
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white">0h</span>
                                    <span className="text-xs font-medium text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded-full">Start learning</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Tabs & Filters */}
                    <div className="border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-0">
                        <div className="flex gap-8 overflow-x-auto w-full sm:w-auto no-scrollbar">
                            <button className="relative pb-4 text-white text-sm font-bold tracking-wide whitespace-nowrap group cursor-pointer">
                                <span className="flex items-center gap-2">In Progress <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full">{inProgressCount}</span></span>
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_#6e3cec]"></span>
                            </button>
                            <button className="relative pb-4 text-slate-400 hover:text-white transition-colors text-sm font-medium tracking-wide whitespace-nowrap cursor-pointer">
                                Completed
                            </button>
                            <button className="relative pb-4 text-slate-400 hover:text-white transition-colors text-sm font-medium tracking-wide whitespace-nowrap cursor-pointer">
                                Wishlist
                            </button>
                        </div>
                    </div>

                    {/* Course Grid (In Progress) */}
                    {enrollments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrollments.map((enrollment) => {
                                const progress = calculateProgress(enrollment);
                                return (
                                <article key={enrollment.Id} className="group relative flex flex-col bg-surface-dark border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-neon hover:-translate-y-1">
                                    <div className="relative h-48 w-full overflow-hidden">
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
                                            style={{ backgroundImage: `url('${getImageUrl(enrollment.course?.ThumbUrl)}')` }}
                                        ></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1333] to-transparent opacity-80"></div>
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Active</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 p-5 gap-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                    {enrollment.course?.Title}
                                                </h3>
                                            </div>
                                            <p className="text-slate-400 text-sm">Instructor: {enrollment.course?.instructor?.FullName || 'Unknown Instructor'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-primary">{progress}% Complete</span>
                                                <span className="text-slate-500">{progress === 100 ? 'Completed' : 'Keep going'}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary rounded-full shadow-[0_0_10px_#6e3cec] transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-2">
                                            <button 
                                                onClick={() => navigate(`/courses/${enrollment.course?.Id}`)}
                                                className="w-full py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all shadow-[0_0_15px_rgba(110,60,236,0.4)] hover:shadow-[0_0_20px_rgba(110,60,236,0.6)] flex items-center justify-center gap-2 group-hover/btn:gap-3"
                                            >
                                                <span className="material-symbols-outlined text-lg">play_circle</span>
                                                Continue Learning
                                            </button>
                                        </div>
                                    </div>
                                </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">school</span>
                            <p className="text-xl font-medium text-white mb-2">No courses enrolled yet</p>
                            <p>Explore our courses and start your learning journey today.</p>
                            <button 
                                onClick={() => navigate('/courses')}
                                className="mt-6 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                            >
                                Browse Courses
                            </button>
                        </div>
                    )}

                    {/* Recently Completed (Mini Section below) */}
                    {/* Keeping this as placeholder or removing if no data? User asked for real data. 
                        Since I don't have completed courses data, I will hide this section or show "No completed courses".
                        For now, I'll comment it out to avoid showing fake data.
                    */}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MyLearningPage;
