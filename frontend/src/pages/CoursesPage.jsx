import { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Header from '../components/Header/Header';
import { fetchCourses, fetchCourseById } from '../services/courseService';
import CourseCard from '../components/Courses/CourseCard';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CoursesPage = () => {
    // Filter states
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedPrice, setSelectedPrice] = useState('All Prices');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedSortOrder, setSelectedSortOrder] = useState('newest'); // Added sortBy state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 8,
        totalPages: 1,
        totalCount: 0
    });

    // Debounce search query
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset page when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [selectedCategoryId, selectedLevel, selectedPrice, debouncedSearchQuery, selectedSortOrder]); // Added selectedSortOrder dependency

    // --- React Query Implementation ---

    // 1. Fetch Categories
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/courses/categories`);
            const data = await res.json();
            return data.success ? data.data : [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour for categories
    });
    
    const categories = categoriesData || [];

    // 2. Fetch Courses
    const fetchCoursesParams = useMemo(() => ({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(selectedCategoryId && { categoryId: selectedCategoryId }),
        ...(selectedLevel && { level: selectedLevel }),
        ...(selectedPrice === 'Free' && { maxPrice: '0' }),
        ...(selectedPrice === 'Paid' && { minPrice: '0.01' }),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        sortBy: selectedSortOrder
    }), [pagination.page, pagination.limit, selectedCategoryId, selectedLevel, selectedPrice, debouncedSearchQuery, selectedSortOrder]);

    const { 
        data: coursesData, 
        isLoading: isCoursesLoading, 
        isError, 
        error: coursesError 
    } = useQuery({
        queryKey: ['courses', fetchCoursesParams],
        queryFn: () => fetchCourses(fetchCoursesParams),
        placeholderData: keepPreviousData, // Keep showing old data while fetching new
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    const courses = useMemo(() => coursesData?.courses || [], [coursesData]);
    const loading = isCoursesLoading; // Backward compatibility for UI
    const error = isError ? (coursesError?.message || 'Failed to fetch') : null;

    // Update pagination state from response (optional, but good for total pages)
    // Update pagination state from response (optional, but good for total pages)
    useEffect(() => {
        if (coursesData?.pagination) {
             setPagination(prev => ({ ...prev, ...coursesData.pagination }));
        }
    }, [coursesData?.pagination]);

    // --- Predictive Prefetching ---
    const queryClient = useQueryClient();

    useEffect(() => {
        if (coursesData?.pagination && pagination.page < pagination.totalPages) {
            const nextPage = pagination.page + 1;
            const nextPageParams = {
                ...fetchCoursesParams,
                page: nextPage.toString()
            };
            
            // Prefetch the next page
            queryClient.prefetchQuery({
                queryKey: ['courses', nextPageParams],
                queryFn: () => fetchCourses(nextPageParams),
                staleTime: 1000 * 60 * 5, // 5 mins
            });
        }
    }, [coursesData, pagination.page, pagination.totalPages, queryClient, fetchCoursesParams]); // Added fetchCoursesParams dependency for linting

    // --- Bulk Prefetching for Visible Courses ---
    useEffect(() => {
        if (courses.length > 0) {
            // Prefetch details for all visible courses immediately
            courses.forEach(course => {
                queryClient.prefetchQuery({
                    queryKey: ['course', course.id],
                    queryFn: () => fetchCourseById(course.id),
                    staleTime: 1000 * 60 * 5, // 5 mins
                });
            });
        }
    }, [courses, queryClient]);

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased selection:bg-primary selection:text-white">
            <Header />

            {/* Main Layout - Full Width */}
            <div className="flex flex-1 overflow-hidden">


                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                                onClick={() => setIsFilterOpen(false)}
                            />
                            <motion.div
                                initial={{ x: -300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -300, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="fixed left-0 top-0 bottom-0 w-64 bg-[#0D071E] border-r border-white/5 p-6 z-50 overflow-y-auto lg:hidden"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="font-semibold text-white">Filters</h3>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsFilterOpen(false)}
                                        className="text-white"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </motion.button>
                                </div>
                                {/* Same filter content as desktop */}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#0D071E] p-6 lg:p-10">
                    <div className="mx-auto max-w-7xl">
                        {/* Header Banner - No Animation */}
                        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1A1333] via-purple-900/30 to-blue-900/30 px-8 py-10 shadow-2xl">
                            {/* Static Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-50"></div>

                            {/* Content */}
                            <div className="relative z-10 max-w-2xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    New Courses Added
                                </div>
                                <h1 className="mb-2 text-4xl font-bold text-white tracking-tight">
                                    Explore the Universe of Knowledge
                                </h1>
                                <p className="text-lg text-slate-300">
                                    Master the skills of tomorrow. From deep space navigation to advanced UI systems.
                                </p>
                            </div>
                        </div>

                        {/* Search Bar - Prominent */}
                        <div className="mb-8">
                            <div className="relative max-w-2xl">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search courses by name, description, or price..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#1A1333] border border-white/10 text-white placeholder-slate-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Inline Filter Bar - Compact Design */}
                        <div className="mb-8 flex flex-wrap items-center gap-3">
                            {/* Category Dropdown Menu */}
                            <div className="relative">
                                {/* Selected Category Display with Dropdown Toggle */}
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#1A1333] to-[#2a2447] border border-white/10 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/20 min-w-[240px]"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                                            <span className="material-symbols-outlined text-xl text-primary">
                                                {selectedCategoryId === '' ? 'apps' : 
                                                 categories.find(c => c.Id === selectedCategoryId) ? 
                                                 (() => {
                                                    const cat = categories.find(c => c.Id === selectedCategoryId);
                                                    const iconMap = {
                                                        'Programming': 'code', 'Design': 'palette', 'Business': 'business_center',
                                                        'Marketing': 'campaign', 'Photography': 'photo_camera', 'Music': 'music_note',
                                                        'Fitness': 'fitness_center', 'Language': 'translate', 'Cooking': 'restaurant',
                                                        'Art': 'brush', 'Science': 'science', 'Math': 'calculate',
                                                        'Writing': 'edit_note', 'Data': 'analytics', 'AI': 'smart_toy',
                                                        'Web': 'language', 'Mobile': 'phone_android', 'Cloud': 'cloud',
                                                        'Security': 'security', 'Game': 'sports_esports'
                                                    };
                                                    for (const [key, icon] of Object.entries(iconMap)) {
                                                        if (cat.Title.toLowerCase().includes(key.toLowerCase())) return icon;
                                                    }
                                                    return 'school';
                                                 })() : 'apps'}
                                            </span>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Category</div>
                                            <div className="text-white font-bold truncate max-w-[140px]">
                                                {selectedCategoryId === '' ? 'All Categories' : (categories.find(c => c.Id === selectedCategoryId)?.Title || 'Unknown')}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <>
                                            <div
                                                onClick={() => setIsFilterOpen(false)}
                                                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200"
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute left-0 mt-2 w-[420px] max-h-[500px] overflow-y-auto z-50 rounded-xl bg-[#0D071E]/95 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-200"
                                            >
                                                <div className="p-2">
                                                    <div className="px-3 py-2 mb-2 border-b border-white/5">
                                                        <h3 className="text-sm font-bold text-white">Browse Categories</h3>
                                                        <p className="text-xs text-slate-500 mt-0.5">{categories.length} categories available</p>
                                                    </div>

                                                    {/* All Courses Option */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCategoryId('');
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:translate-x-1 ${
                                                            selectedCategoryId === ''
                                                                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20'
                                                                : 'hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                                            selectedCategoryId === '' ? 'bg-white/20' : 'bg-primary/10'
                                                        }`}>
                                                            <span className={`material-symbols-outlined text-lg ${
                                                                selectedCategoryId === '' ? 'text-white' : 'text-primary'
                                                            }`}>
                                                                apps
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className={`text-sm font-semibold ${
                                                                selectedCategoryId === '' ? 'text-white' : 'text-slate-200'
                                                            }`}>
                                                                All Courses
                                                            </p>
                                                            <p className={`text-xs ${
                                                                selectedCategoryId === '' ? 'text-white/70' : 'text-slate-500'
                                                            }`}>
                                                                {pagination.totalCount} courses
                                                            </p>
                                                        </div>
                                                        {selectedCategoryId === '' && (
                                                            <span className="material-symbols-outlined text-white text-lg">
                                                                check_circle
                                                            </span>
                                                        )}
                                                    </button>

                                                    {/* Category List */}
                                                    <div className="mt-2 space-y-1">
                                                        {categories.map((cat) => {
                                                            const getCategoryIcon = (title) => {
                                                                const iconMap = {
                                                                    'Programming': 'code', 'Design': 'palette', 'Business': 'business_center',
                                                                    'Marketing': 'campaign', 'Photography': 'photo_camera', 'Music': 'music_note',
                                                                    'Fitness': 'fitness_center', 'Language': 'translate', 'Cooking': 'restaurant',
                                                                    'Art': 'brush', 'Science': 'science', 'Math': 'calculate',
                                                                    'Writing': 'edit_note', 'Data': 'analytics', 'AI': 'smart_toy',
                                                                    'Web': 'language', 'Mobile': 'phone_android', 'Cloud': 'cloud',
                                                                    'Security': 'security', 'Game': 'sports_esports'
                                                                };
                                                                for (const [key, icon] of Object.entries(iconMap)) {
                                                                    if (title.toLowerCase().includes(key.toLowerCase())) return icon;
                                                                }
                                                                return 'school';
                                                            };

                                                            return (
                                                                <button
                                                                    key={cat.Id}
                                                                    onClick={() => {
                                                                        setSelectedCategoryId(cat.Id);
                                                                        setIsFilterOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:translate-x-1 ${
                                                                        selectedCategoryId === cat.Id
                                                                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20'
                                                                            : 'hover:bg-white/5'
                                                                    }`}
                                                                >
                                                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                                                        selectedCategoryId === cat.Id ? 'bg-white/20' : 'bg-primary/10'
                                                                    }`}>
                                                                        <span className={`material-symbols-outlined text-lg ${
                                                                            selectedCategoryId === cat.Id ? 'text-white' : 'text-primary'
                                                                        }`}>
                                                                            {getCategoryIcon(cat.Title)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex-1 text-left">
                                                                        <p className={`text-sm font-semibold ${
                                                                            selectedCategoryId === cat.Id ? 'text-white' : 'text-slate-200'
                                                                        }`}>
                                                                            {cat.Title}
                                                                        </p>
                                                                        <p className={`text-xs ${
                                                                            selectedCategoryId === cat.Id ? 'text-white/70' : 'text-slate-500'
                                                                        }`}>
                                                                            {cat.CourseCount} courses
                                                                        </p>
                                                                    </div>
                                                                    {selectedCategoryId === cat.Id && (
                                                                        <span className="material-symbols-outlined text-white text-lg">
                                                                            check_circle
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <SortFilterDropdown 
                                selectedSortOrder={selectedSortOrder}
                                setSelectedSortOrder={setSelectedSortOrder}
                            />

                            <LevelFilterDropdown 
                                selectedLevel={selectedLevel}
                                setSelectedLevel={setSelectedLevel}
                            />

                            {/* Price Filter Dropdown */}
                            <PriceFilterDropdown 
                                selectedPrice={selectedPrice}
                                setSelectedPrice={setSelectedPrice}
                            />

                            {/* Clear All Filters */}
                            {(selectedCategoryId || selectedLevel || selectedPrice !== 'All Prices' || searchQuery) && (
                                <button
                                    onClick={() => {
                                        setSelectedCategoryId('');
                                        setSelectedLevel('');
                                        setSelectedPrice('All Prices');
                                        setSearchQuery('');
                                    }}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                    <span className="text-sm font-semibold">Clear All</span>
                                </button>
                            )}
                        </div>


                        {/* Filter Sort Mobile */}
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                                Showing <span className="text-white font-semibold">{courses.length}</span> of <span className="text-white font-semibold">{pagination.totalCount}</span> courses
                            </p>
                            <div className="flex items-center gap-2 lg:hidden">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsFilterOpen(true)}
                                    className="flex items-center gap-2 rounded-lg bg-[#1A1333] px-3 py-2 text-sm text-white border border-white/5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                    Filters
                                </motion.button>
                            </div>
                        </div>

                        {/* Courses Grid - No Animation */}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {loading ? (
                                // Loading skeleton
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="animate-pulse rounded-2xl bg-[#1A1333] border border-white/5">
                                        <div className="aspect-video w-full bg-[#2a2a3a] rounded-t-2xl"></div>
                                        <div className="p-5 space-y-3">
                                            <div className="h-4 bg-[#2a2a3a] rounded w-3/4"></div>
                                            <div className="h-4 bg-[#2a2a3a] rounded w-1/2"></div>
                                            <div className="h-16 bg-[#2a2a3a] rounded"></div>
                                            <div className="h-10 bg-[#2a2a3a] rounded"></div>
                                        </div>
                                    </div>
                                ))
                            ) : error ? (
                                // Error state
                                <div className="col-span-full flex flex-col items-center justify-center py-20">
                                    <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                                    <h3 className="text-xl font-bold text-white mb-2">Failed to load courses</h3>
                                    <p className="text-slate-400">{error}</p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => window.location.reload()}
                                        className="mt-4 px-6 py-2 bg-primary rounded-lg text-white font-semibold"
                                    >
                                        Retry
                                    </motion.button>
                                </div>
                            ) : courses.length === 0 ? (
                                // No courses state
                                <div className="col-span-full flex flex-col items-center justify-center py-20">
                                    <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">search_off</span>
                                    <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
                                    <p className="text-slate-400 mb-4">Try adjusting your filters or search terms</p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setSelectedCategoryId('');
                                            setSelectedLevel('');
                                            setSelectedPrice('All Prices');
                                        }}
                                        className="px-6 py-2 bg-primary rounded-lg text-white font-semibold"
                                    >
                                        Clear Filters
                                    </motion.button>
                                </div>
                            ) : (
                                // Courses from database
                                courses.map(course => (
                                    <CourseCard 
                                        key={course.id}
                                        id={course.id}
                                        image={course.image}
                                        category={course.category}
                                        level={course.level}
                                        rating={course.rating.toString()}
                                        reviews={course.reviews.toString()}
                                        duration={course.duration}
                                        title={course.title}
                                        desc={course.description}
                                        instructorName={course.instructorName}
                                        instructorRole="Instructor"

                                        price={course.price}
                                    />
                                ))
                            )}
                        </div>

                        {/* Pagination - No Animation */}
                        {!loading && courses.length > 0 && pagination.totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-2 pb-10">
                                {/* Previous Button */}
                                <PaginationButton 
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </PaginationButton>

                                {/* Page Numbers */}
                                {(() => {
                                    const currentPage = pagination.page;
                                    const totalPages = pagination.totalPages;
                                    const pageNumbers = [];
                                    
                                    // Show max 5 page numbers
                                    let startPage = Math.max(1, currentPage - 2);
                                    let endPage = Math.min(totalPages, currentPage + 2);
                                    
                                    // Adjust if at the beginning or end
                                    if (currentPage <= 3) {
                                        endPage = Math.min(5, totalPages);
                                    }
                                    if (currentPage > totalPages - 3) {
                                        startPage = Math.max(1, totalPages - 4);
                                    }
                                    
                                    for (let i = startPage; i <= endPage; i++) {
                                        pageNumbers.push(
                                            <PaginationButton 
                                                key={i}
                                                active={i === currentPage}
                                                onClick={() => setPagination(prev => ({ ...prev, page: i }))}
                                            >
                                                {i}
                                            </PaginationButton>
                                        );
                                    }
                                    
                                    return pageNumbers;
                                })()}
                                
                                {/* Show ellipsis if there are more pages */}
                                {pagination.page < pagination.totalPages - 3 && (
                                    <span className="text-slate-500">...</span>
                                )}

                                {/* Next Button */}
                                <PaginationButton 
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                    disabled={pagination.page === pagination.totalPages}
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </PaginationButton>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};


// Sort Filter Dropdown Component
const SortFilterDropdown = ({ selectedSortOrder, setSelectedSortOrder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const sortOptions = [
        { value: 'newest', label: 'Newest', icon: 'new_releases' },
        { value: 'popular', label: 'Popular', icon: 'trending_up' },
        { value: 'price_asc', label: 'Price: Low to High', icon: 'arrow_upward' },
        { value: 'price_desc', label: 'Price: High to Low', icon: 'arrow_downward' }
    ];
    
    // Find current label and icon
    const currentOption = sortOptions.find(opt => opt.value === selectedSortOrder) || sortOptions[0];
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="relative"
        >
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#1A1333] to-[#2a2447] border border-white/10 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/20 min-w-[200px]"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-primary">
                        {currentOption.icon}
                    </span>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 mb-0.5">Sort By</p>
                        <p className="text-sm font-bold text-white">{currentOption.label}</p>
                    </div>
                </div>
                <motion.span 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="material-symbols-outlined text-slate-400"
                >
                    expand_more
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 mt-2 w-full min-w-[220px] z-50 rounded-xl bg-[#0D071E]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2"
                        >
                            {sortOptions.map((option) => (
                                <motion.button
                                    key={option.value}
                                    whileHover={{ x: 4 }}
                                    onClick={() => {
                                        setSelectedSortOrder(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                        selectedSortOrder === option.value
                                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20'
                                            : 'hover:bg-white/5'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${
                                        selectedSortOrder === option.value ? 'text-white' : 'text-primary'
                                    }`}>
                                        {option.icon}
                                    </span>
                                    <p className={`text-sm font-semibold ${
                                        selectedSortOrder === option.value ? 'text-white' : 'text-slate-200'
                                    }`}>
                                        {option.label}
                                    </p>
                                    {selectedSortOrder === option.value && (
                                        <span className="material-symbols-outlined text-white text-lg ml-auto">
                                            check_circle
                                        </span>
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Level Filter Dropdown Component
const LevelFilterDropdown = ({ selectedLevel, setSelectedLevel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
    
    const levelIcons = {
        'All Levels': 'list',
        'Beginner': 'star_border',
        'Intermediate': 'stars',
        'Advanced': 'workspace_premium'
    };
    
    const displayLevel = selectedLevel || 'All Levels';
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17, duration: 0.3 }}
            className="relative"
        >
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#1A1333] to-[#2a2447] border border-white/10 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/20 min-w-[180px]"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-primary">
                        {levelIcons[displayLevel] || 'list'}
                    </span>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 mb-0.5">Level</p>
                        <p className="text-sm font-bold text-white">{displayLevel}</p>
                    </div>
                </div>
                <motion.span 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="material-symbols-outlined text-slate-400"
                >
                    expand_more
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 mt-2 w-full min-w-[220px] z-50 rounded-xl bg-[#0D071E]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2"
                        >
                            {levels.map((level) => (
                                <motion.button
                                    key={level}
                                    whileHover={{ x: 4 }}
                                    onClick={() => {
                                        setSelectedLevel(level === 'All Levels' ? '' : level);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                        displayLevel === level
                                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20'
                                            : 'hover:bg-white/5'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${
                                        displayLevel === level ? 'text-white' : 'text-primary'
                                    }`}>
                                        {levelIcons[level] || 'list'}
                                    </span>
                                    <p className={`text-sm font-semibold ${
                                        displayLevel === level ? 'text-white' : 'text-slate-200'
                                    }`}>
                                        {level}
                                    </p>
                                    {displayLevel === level && (
                                        <span className="material-symbols-outlined text-white text-lg ml-auto">
                                            check_circle
                                        </span>
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Price Filter Dropdown Component
const PriceFilterDropdown = ({ selectedPrice, setSelectedPrice }) => {
    const [isOpen, setIsOpen] = useState(false);
    const prices = ['All Prices', 'Free', 'Paid'];
    
    const priceIcons = {
        'All Prices': 'attach_money',
        'Free': 'money_off',
        'Paid': 'payments'
    };
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.3 }}
            className="relative"
        >
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#1A1333] to-[#2a2447] border border-white/10 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/20 min-w-[180px]"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-primary">
                        {priceIcons[selectedPrice] || 'attach_money'}
                    </span>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 mb-0.5">Price</p>
                        <p className="text-sm font-bold text-white">{selectedPrice}</p>
                    </div>
                </div>
                <motion.span 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="material-symbols-outlined text-slate-400"
                >
                    expand_more
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 mt-2 w-full min-w-[200px] z-50 rounded-xl bg-[#0D071E]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2"
                        >
                            {prices.map((price) => (
                                <motion.button
                                    key={price}
                                    whileHover={{ x: 4 }}
                                    onClick={() => {
                                        setSelectedPrice(price);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                        selectedPrice === price
                                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20'
                                            : 'hover:bg-white/5'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${
                                        selectedPrice === price ? 'text-white' : 'text-primary'
                                    }`}>
                                        {priceIcons[price]}
                                    </span>
                                    <p className={`text-sm font-semibold ${
                                        selectedPrice === price ? 'text-white' : 'text-slate-200'
                                    }`}>
                                        {price}
                                    </p>
                                    {selectedPrice === price && (
                                        <span className="material-symbols-outlined text-white text-lg ml-auto">
                                            check_circle
                                        </span>
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Filter Section Component
const FilterSection = ({ title, children, isLast = false }) => (
    <div className={`mb-6 ${!isLast ? 'pb-6 border-b border-white/5' : ''}`}>
        <h4 className="mb-4 font-medium text-white">{title}</h4>
        {children}
    </div>
);

// Checkbox Filter Component
const CheckboxFilter = ({ label, checked, onChange }) => (
    <motion.label 
        whileHover={{ x: 4 }}
        className="flex items-center gap-3 cursor-pointer group"
    >
        <div className="relative flex items-center">
            <motion.input 
                type="checkbox"
                checked={checked}
                onChange={onChange}
                whileTap={{ scale: 0.9 }}
                className="peer h-4 w-4 appearance-none rounded border border-slate-600 bg-[#1A1333] checked:border-primary checked:bg-primary focus:ring-0 focus:ring-offset-0 transition-all" 
            />
            <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: checked ? 1 : 0 }}
                transition={{ duration: 0.2, ease: "backOut" }}
                className="material-symbols-outlined absolute left-0 top-0 text-white text-[16px] pointer-events-none"
            >
                check
            </motion.span>
        </div>
        <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
            {label}
        </span>
    </motion.label>
);

// Radio Filter Component
const RadioFilter = ({ label, name, checked, onChange }) => (
    <motion.label 
        whileHover={{ x: 4 }}
        className="flex items-center gap-3 cursor-pointer group"
    >
        <motion.input 
            whileTap={{ scale: 0.9 }}
            className="h-4 w-4 border-slate-600 bg-[#1A1333] text-primary focus:ring-0 focus:ring-offset-0" 
            name={name} 
            type="radio" 
            checked={checked}
            onChange={onChange}
        />
        <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{label}</span>
    </motion.label>
);

// Pagination Button Component
const PaginationButton = ({ children, active = false, onClick, disabled = false }) => (
    <motion.button
        whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={onClick}
        disabled={disabled}
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
            active 
                ? 'bg-primary text-white font-medium shadow-lg shadow-primary/20' 
                : disabled
                ? 'border border-white/5 bg-[#1A1333]/50 text-slate-600 cursor-not-allowed'
                : 'border border-white/5 bg-[#1A1333] text-slate-400 hover:bg-[#2e2447] hover:text-white cursor-pointer'
        }`}
    >
        {children}
    </motion.button>
);

// CourseCard moved to components/Courses/CourseCard.jsx

export default CoursesPage;
