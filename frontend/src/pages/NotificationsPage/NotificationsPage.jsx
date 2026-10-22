import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import useAuth from '../../hooks/useAuth';
import { fetchNotifications, markNotificationAsRead } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, Info, BookOpen, AlertCircle, Inbox, Mail, RefreshCw } from 'lucide-react';

const NotificationsPage = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['notifications', page],
        queryFn: () => fetchNotifications(page, 20),
        enabled: !!user,
        refetchInterval: 10000, // Poll every 10 seconds while on this page
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id) => markNotificationAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['unreadNotificationsCount']);
        },
    });

    const handleMarkAsRead = (id) => {
        markAsReadMutation.mutate(id);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'COURSE_COMPLETED':
                return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'COURSE_PUBLISHED':
            case 'COURSE_CREATED':
                return <BookOpen className="w-5 h-5 text-blue-400" />;
            case 'COURSE_SUBMISSION':
            case 'SUBMISSION_CONFIRMED':
                return <Info className="w-5 h-5 text-amber-400" />;
            case 'ACCOUNT_UNLOCKED':
                return <Inbox className="w-5 h-5 text-purple-400" />;
            default:
                return <Bell className="w-5 h-5 text-primary" />;
        }
    };

    const notifications = data?.data || [];
    const pagination = data?.pagination || {};

    if (authLoading || (isLoading && !!user)) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-white flex flex-col">
            <Header />
            <main className="flex-1 w-full max-w-[1000px] mx-auto py-12 px-4 md:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                            <Bell className="w-8 h-8 text-primary" />
                            Notifications
                        </h1>
                        <p className="text-slate-400">Stay updated with your learning progress and system alerts.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className={`p-2.5 rounded-full bg-surface-dark border border-white/10 hover:border-primary/50 transition-all ${isFetching ? 'opacity-50' : ''}`}
                            title="Refresh notifications"
                        >
                            <RefreshCw className={`w-5 h-5 text-primary ${isFetching ? 'animate-spin' : ''}`} />
                        </button>
                        {notifications.length > 0 && (
                             <div className="hidden sm:block">
                             <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-xs font-bold text-primary">
                                 {notifications.filter(n => n.Status === 'Unread').length} New Notifications
                             </div>
                         </div>
                        )}
                    </div>
                </div>

                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-surface-dark border border-white/5 rounded-3xl">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Mail className="w-12 h-12 text-slate-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No notifications yet</h2>
                        <p className="text-slate-400 max-w-sm">When you receive updates or complete courses, they'll show up here.</p>
                        <button 
                            onClick={() => navigate('/courses')}
                            className="mt-8 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-all"
                        >
                            Explore Courses
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {notifications.map((notification) => (
                            <div 
                                key={notification.Id}
                                className={`group flex gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                                    notification.Status === 'Unread' 
                                    ? 'bg-surface-dark/80 border-primary/30 shadow-neon-sm' 
                                    : 'bg-surface-dark/40 border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                                    notification.Status === 'Unread' ? 'bg-primary/20' : 'bg-white/5'
                                }`}>
                                    {getIcon(notification.Type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className={`text-sm font-semibold tracking-wide ${
                                            notification.Status === 'Unread' ? 'text-primary' : 'text-slate-400'
                                        }`}>
                                            {notification.Type.replace(/_/g, ' ')}
                                        </p>
                                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.CreationTime), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className={`text-base leading-relaxed ${
                                        notification.Status === 'Unread' ? 'text-white font-medium' : 'text-slate-300'
                                    }`}>
                                        {notification.Message}
                                    </p>
                                    
                                    {notification.Status === 'Unread' && (
                                        <button 
                                            onClick={() => handleMarkAsRead(notification.Id)}
                                            className="mt-3 text-xs font-bold text-primary hover:text-white transition-colors flex items-center gap-1.5"
                                        >
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                                
                                {notification.Status === 'Unread' && (
                                    <div className="flex-shrink-0 self-center">
                                        <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-neon animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <button 
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-4 py-2 rounded-xl bg-surface-dark border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/50 transition-all font-bold text-sm"
                                >
                                    Previous
                                </button>
                                <span className="text-slate-400 text-sm">
                                    Page {page} of {pagination.pages}
                                </span>
                                <button 
                                    disabled={page === pagination.pages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-4 py-2 rounded-xl bg-surface-dark border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/50 transition-all font-bold text-sm"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default NotificationsPage;
