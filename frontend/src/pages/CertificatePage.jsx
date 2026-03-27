import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCourseLessons, fetchEnrollmentProgress } from '../services/lessonService';
import useAuth from '../hooks/useAuth';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import toast from 'react-hot-toast';

const CertificatePage = () => {
    const { courseId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isDownloadingImage, setIsDownloadingImage] = React.useState(false);
    const [isPrinting, setIsPrinting] = React.useState(false);

    // Standard colors for html2canvas compatibility (avoiding oklch)
    const CERT_COLORS = {
        primary: '#6e3cec',
        primarySoft: 'rgba(110, 60, 236, 0.1)',
        primaryText: '#4f46e5',
        purple: '#7e22ce',
        amber: '#f59e0b',
        amberSoft: 'rgba(245, 158, 11, 0.1)',
        yellow: '#fbbf24',
        yellowLight: '#fef3c7',
        slate900: '#0f172a',
        slate500: '#64748b',
        slate400: '#94a2b8',
        slate100: '#f1f5f9',
        emerald: '#10b981',
        emeraldSoft: 'rgba(16, 185, 129, 0.1)'
    };

    const { data: course, isLoading: courseLoading } = useQuery({
        queryKey: ['courseLessons', courseId],
        queryFn: () => fetchCourseLessons(courseId),
        enabled: !!courseId,
    });

    const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
        queryKey: ['enrollmentProgress', courseId, user?.id],
        queryFn: () => fetchEnrollmentProgress(user?.id, courseId),
        enabled: !!courseId && !!user?.id,
    });

    useEffect(() => {
        if (!enrollmentLoading && enrollment?.Status === 'Completed') {
            // Load Confetti
            const confettiScript = document.createElement('script');
            confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
            confettiScript.async = true;
            confettiScript.onload = () => {
                if (window.confetti) {
                    window.confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#a855f7', '#6e3cec', '#ffffff', '#fbbf24']
                    });
                }
            };
            document.body.appendChild(confettiScript);

            // Load html-to-image
            const canvasScript = document.createElement('script');
            canvasScript.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
            canvasScript.async = true;
            document.body.appendChild(canvasScript);

            return () => {
                if (document.body.contains(confettiScript)) document.body.removeChild(confettiScript);
                if (document.body.contains(canvasScript)) document.body.removeChild(canvasScript);
            };
        }
    }, [enrollmentLoading, enrollment?.Status]);

    const handlePrint = () => {
        setIsPrinting(true);
        toast.success('Preparing PDF for print...');
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };

    const handleDownloadImage = async () => {
        if (!window.htmlToImage) {
            toast.error('Download library still loading. Please try again in a moment.');
            return;
        }

        const element = document.getElementById('certificate-content');
        if (!element) return;

        setIsDownloadingImage(true);
        const loadingToast = toast.loading('Generating high-quality image...');

        try {
            const dataUrl = await window.htmlToImage.toPng(element, {
                pixelRatio: 3, // High quality
                backgroundColor: '#ffffff',
                cacheBust: true,
                style: {
                    transform: 'none',
                    margin: '0',
                    borderRadius: '0'
                }
            });
            
            const link = document.createElement('a');
            link.download = `FlyUp-Certificate-${course?.Title?.replace(/\s+/g, '-') || 'Course'}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Certificate downloaded successfully!', { id: loadingToast });
        } catch (error) {
            console.error('Error generating image:', error);
            toast.error('Failed to generate image. Please try the "Download PDF" option.', { id: loadingToast });
        } finally {
            setIsDownloadingImage(false);
        }
    };

    if (courseLoading || enrollmentLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center text-white">
                <div className="relative size-16">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!enrollment || enrollment.Status !== 'Completed') {
        return (
            <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center text-white p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                >
                    <span className="material-symbols-outlined text-6xl text-amber-500 mb-4">warning</span>
                    <h2 className="text-2xl font-bold mb-2">Certificate Not Available</h2>
                    <p className="text-slate-400 text-center max-w-md mb-6">
                        You haven't completed this course yet. Please finish all lessons to earn your certificate.
                    </p>
                    <button 
                        onClick={() => navigate(`/learning/${courseId}`)}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-purple-600 rounded-full font-bold hover:shadow-neon transition-all"
                    >
                        Back to Course
                    </button>
                </motion.div>
            </div>
        );
    }

    const completionDate = new Date(enrollment.CreationTime || enrollment.LastModificationTime || new Date()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const studentName = user?.fullName || user?.FullName || user?.name || 'Learner';

    return (
        <div className="min-h-screen bg-[#0a0a14] text-white flex flex-col selection:bg-primary/30">
            <Header />
            
            <main className="flex-1 flex flex-col items-center py-12 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] size-[500px] bg-primary/20 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] size-[500px] bg-blue-500/20 rounded-full blur-[120px]"></div>
                </div>

                <div className="max-w-4xl w-full flex flex-col gap-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded tracking-wider border border-emerald-500/30">Verified Achievement</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-neon">Congratulations!</h1>
                            <p className="text-slate-400">You've successfully mastered this course content.</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap justify-center md:justify-end gap-3">
                            <button 
                                onClick={handlePrint} 
                                disabled={isPrinting || isDownloadingImage}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all group text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className={`material-symbols-outlined text-lg ${isPrinting ? 'animate-spin' : 'group-hover:scale-110'} transition-transform`}>
                                    {isPrinting ? 'progress_activity' : 'picture_as_pdf'}
                                </span> 
                                {isPrinting ? 'Preparing...' : 'Download PDF'}
                            </button>
                            <button 
                                onClick={handleDownloadImage} 
                                disabled={isPrinting || isDownloadingImage}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all group text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className={`material-symbols-outlined text-lg ${isDownloadingImage ? 'animate-spin' : 'group-hover:scale-110'} transition-transform`}>
                                    {isDownloadingImage ? 'progress_activity' : 'image'}
                                </span>
                                {isDownloadingImage ? 'Generating...' : 'Download Image'}
                            </button>
                            <button onClick={() => navigate('/my-learning')} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 rounded-xl font-bold transition-all shadow-neon group text-sm">
                                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">dashboard</span> My Learning
                            </button>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative p-1 md:p-10 bg-white text-slate-900 overflow-hidden print:m-0 print:p-0 group" 
                        style={{ 
                            borderRadius: '1rem',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        }}
                        id="certificate-content"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 no-print"></div>
                        <div className="absolute inset-0 border-[24px] border-double border-slate-100 pointer-events-none"></div>
                        <div className="absolute inset-6 border-2 border-slate-900/5 pointer-events-none"></div>
                        
                        <div 
                            className="relative z-10 flex flex-col items-center text-center p-12 md:p-20 border-[8px] m-6"
                            style={{ borderColor: 'rgba(15, 23, 42, 0.1)' }}
                        >
                            <div className="mb-10">
                                <motion.div 
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }} 
                                    transition={{ type: "spring", delay: 0.5 }} 
                                    className="size-24 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-lg"
                                    style={{ backgroundColor: CERT_COLORS.primarySoft }}
                                >
                                    <span className="material-symbols-outlined text-5xl font-bold" style={{ color: CERT_COLORS.primary }}>school</span>
                                </motion.div>
                                <h2 className="text-2xl font-black tracking-tighter uppercase" style={{ color: CERT_COLORS.slate900 }}>
                                    FlyUp <span style={{ color: CERT_COLORS.primary }}>EduTech</span>
                                </h2>
                            </div>

                            <div className="space-y-3 mb-12">
                                <p className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: CERT_COLORS.slate400 }}>Professional Certificate of Completion</p>
                                <h3 className="text-xl font-serif italic" style={{ color: CERT_COLORS.slate500 }}>This is to officially certify that</h3>
                            </div>

                            <div className="mb-14">
                                <h2 className="text-5xl md:text-7xl font-serif font-bold border-b-4 border-double pb-4 px-12 inline-block leading-tight" style={{ color: CERT_COLORS.slate900, borderColor: 'rgba(15, 23, 42, 0.2)' }}>
                                    {studentName}
                                </h2>
                            </div>

                            <div className="space-y-4 mb-20">
                                <p className="text-xl font-medium" style={{ color: CERT_COLORS.slate500 }}>Successfully completed the professional course</p>
                                <h4 className="text-3xl md:text-4xl font-extrabold max-w-2xl leading-tight" style={{ color: CERT_COLORS.primary }}>
                                    {course?.data?.Title || course?.Title || 'Course Title'}
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full max-w-2xl mt-12 mb-8">
                                <div className="flex flex-col items-center">
                                    <div className="font-serif text-3xl mb-3 italic tracking-tight" style={{ color: '#1e293b' }}>FlyUp Team</div>
                                    <div className="w-48 h-[2px] mb-3" style={{ background: 'linear-gradient(to right, transparent, #cbd5e1, transparent)' }}></div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: CERT_COLORS.slate400 }}>Academic Director</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="font-serif text-2xl mb-3 tracking-tight" style={{ color: '#1e293b' }}>{completionDate}</div>
                                    <div className="w-48 h-[2px] mb-3" style={{ background: 'linear-gradient(to right, transparent, #cbd5e1, transparent)' }}></div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: CERT_COLORS.slate400 }}>Date of Achievement</p>
                                </div>
                            </div>

                            <div className="absolute bottom-16 right-16 opacity-100 hidden md:block select-none rotate-12">
                                <div className="size-40 relative flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full" style={{ backgroundColor: CERT_COLORS.amberSoft }}></div>
                                    <div className="size-32 rounded-full flex items-center justify-center border-4 p-1" style={{ background: `linear-gradient(to bottom right, ${CERT_COLORS.yellow}, ${CERT_COLORS.yellowLight}, ${CERT_COLORS.amber})`, borderColor: 'rgba(180, 83, 9, 0.3)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                                        <div className="size-full rounded-full border flex items-center justify-center text-center p-3" style={{ borderColor: 'rgba(180, 83, 9, 0.2)' }}>
                                            <div className="flex flex-col items-center">
                                                <span className="material-symbols-outlined text-3xl mb-1" style={{ color: '#78350f' }}>verified_user</span>
                                                <span className="text-[7px] font-black uppercase leading-none" style={{ color: '#78350f' }}>Official<br/>FlyUp<br/>Certified</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-4 -left-2 w-8 h-20 clip-path-ribbon transform -rotate-[20deg] z-[-1]" style={{ backgroundColor: 'rgba(180, 83, 9, 0.4)' }}></div>
                                    <div className="absolute -bottom-4 -right-2 w-8 h-20 clip-path-ribbon transform rotate-[20deg] z-[-1]" style={{ backgroundColor: 'rgba(180, 83, 9, 0.4)' }}></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer className="no-print" />

            <style dangerouslySetInnerHTML={{ __html: `
                .clip-path-ribbon { clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%); }
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
                    main { padding: 0 !important; margin: 0 !important; min-height: auto !important; height: 100vh !important; }
                    #certificate-content { 
                        width: 100vw !important; 
                        height: 100vh !important; 
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        transform: none !important;
                        opacity: 1 !important;
                    }
                    @page { size: landscape; margin: 0; }
                }
                .drop-shadow-neon { filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.4)); }
            `}} />
        </div>
    );
};

export default CertificatePage;
