import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

const QuizResultPage = ({
    result,
    assignmentName,
    onBack,
    onNextLesson,
    gradeToPass = 5
}) => {

    const { user } = useAuth();
    const [showReview, setShowReview] = useState(false);

    const {
        correctCount = 0,
        totalQuestions = 1,
        timeSpent = 0,
        score = 0,
        questionHistory = []
    } = result || {};

    const percentage = totalQuestions
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    const strokeDashoffset = 100 - percentage;

    const scoreOut10 =
        score || Math.round((correctCount / totalQuestions) * 10 * 10) / 10;

    const isPassed = scoreOut10 >= gradeToPass;

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const userName = user?.FullName?.split(' ').pop() || 'Learner';

    return (
        <div className="fixed inset-0 z-50 bg-quiz-bg-dark font-quiz text-white overflow-hidden">

            {/* Nebula background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] nebula-glow-purple rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] nebula-glow-fuchsia rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] nebula-glow-purple opacity-50 rounded-full"></div>
            </div>

            <div className="relative flex flex-col h-screen w-full">

                {/* Header */}
                <header className="w-full px-6 lg:px-20 py-4 glass-card z-10 border-b border-white/5">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">

                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#7f13ec] text-3xl">
                                rocket_launch
                            </span>
                            <h2 className="text-xl font-bold tracking-tight">
                                QUIZ<span className="text-[#7f13ec]">Fly</span>
                            </h2>
                        </div>

                        <div className="flex items-center gap-8">

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                                    Status
                                </span>

                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                    <span className="size-2 bg-green-500 rounded-full"></span>
                                    <span className="text-sm font-medium text-green-400">
                                        Quiz Finished
                                    </span>
                                </div>
                            </div>

                            {user?.AvatarUrl && (
                                <div className="bg-white/10 rounded-full p-1 border border-white/10">
                                    <div
                                        className="size-10 rounded-full bg-cover bg-center"
                                        style={{
                                            backgroundImage: `url('${user.AvatarUrl}')`
                                        }}
                                    />
                                </div>
                            )}

                        </div>
                    </div>
                </header>

                {/* MAIN */}
                {!showReview ? (

                    <main className="flex-1 overflow-auto custom-scrollbar">

                        <div className="flex flex-col items-center justify-center px-6 py-8 max-w-5xl mx-auto w-full gap-8 min-h-full">

                            {/* Score Circle */}
                            <div className="flex flex-col items-center gap-6">

                                <div className="relative group">

                                    <div className="absolute inset-0 bg-[#7f13ec]/30 blur-3xl rounded-full scale-110"></div>
                                    <div className="absolute inset-0 bg-fuchsia-600/20 blur-2xl rounded-full scale-125"></div>

                                    <div className="relative size-56 md:size-64 rounded-full flex items-center justify-center bg-quiz-bg-dark/80 backdrop-blur-xl border border-white/10 shadow-2xl">

                                        <div className="flex flex-col items-center text-center">

                                            <span className="text-4xl md:text-5xl font-bold text-white mb-1">
                                                {correctCount}/{totalQuestions}
                                            </span>

                                            <span className="text-[#7f13ec] font-bold text-base uppercase tracking-tighter">
                                                Correct
                                            </span>

                                            <div className="mt-3 px-4 py-1.5 bg-[#7f13ec]/20 rounded-full border border-[#7f13ec]/30">
                                                <span className="text-xl font-bold text-white">
                                                    {percentage}%
                                                </span>
                                            </div>

                                        </div>

                                        <svg className="absolute inset-0 size-full -rotate-90 pointer-events-none">

                                            <circle
                                                className="text-white/5"
                                                cx="50%"
                                                cy="50%"
                                                fill="transparent"
                                                r="46%"
                                                stroke="currentColor"
                                                strokeWidth="12"
                                            />

                                            <circle
                                                className="text-[#7f13ec]"
                                                cx="50%"
                                                cy="50%"
                                                fill="transparent"
                                                pathLength="100"
                                                r="46%"
                                                stroke="currentColor"
                                                strokeDasharray="100"
                                                strokeDashoffset={strokeDashoffset}
                                                strokeLinecap="round"
                                                strokeWidth="12"
                                                style={{
                                                    transition: 'stroke-dashoffset 1.5s ease-out'
                                                }}
                                            />

                                            <circle
                                                className="text-fuchsia-500 opacity-50"
                                                cx="50%"
                                                cy="50%"
                                                fill="transparent"
                                                pathLength="100"
                                                r="46%"
                                                stroke="currentColor"
                                                strokeDasharray="100"
                                                strokeDashoffset={strokeDashoffset}
                                                strokeLinecap="round"
                                                strokeWidth="2"
                                            />

                                        </svg>

                                    </div>
                                </div>

                                <div className="text-center">

                                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">

                                        {percentage >= 80
                                            ? `Xuất sắc, ${userName}!`
                                            : percentage >= 60
                                                ? `Tốt lắm, ${userName}!`
                                                : `Cố lên, ${userName}!`}

                                    </h1>

                                    <p className="text-white/60 text-base">
                                        {assignmentName}
                                    </p>

                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-col md:flex-row gap-5 w-full max-w-xl justify-center">

                                <div className="glass-card rounded-2xl p-6 flex-1 flex flex-col items-center text-center gap-3 hover:bg-white/5 transition-all">

                                    <div className="size-14 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                                        <span className="material-symbols-outlined text-cyan-400 text-3xl">
                                            schedule
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">
                                            Time Spent
                                        </p>
                                        <p className="text-3xl font-bold text-white">
                                            {formatTime(timeSpent)}
                                        </p>
                                    </div>

                                </div>

                                <div className="glass-card rounded-2xl p-6 flex-1 flex flex-col items-center text-center gap-3 hover:bg-white/5 transition-all">

                                    <div className="size-14 rounded-xl bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                                        <span className="material-symbols-outlined text-fuchsia-400 text-3xl">
                                            target
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">
                                            Accuracy
                                        </p>
                                        <p className="text-3xl font-bold text-white">
                                            {percentage}%
                                        </p>
                                    </div>

                                </div>

                            </div>

                            {/* Score */}
                            <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center gap-4 max-w-xl w-full">

                                <div className="flex items-center gap-3">

                                    <span className={`text-3xl font-bold ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                                        {scoreOut10.toFixed(1)}/10
                                    </span>

                                    <div className={`px-4 py-2 rounded-full border-2 font-bold ${isPassed
                                        ? 'border-green-400/50 bg-green-500/10 text-green-400'
                                        : 'border-red-400/50 bg-red-500/10 text-red-400'
                                        }`}>
                                        {isPassed ? 'PASS' : 'FAIL'}
                                    </div>

                                </div>

                                <p className="text-white/50 text-sm">
                                    Điểm yêu cầu: {gradeToPass.toFixed(1)}/10
                                </p>

                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl">

                                <button
                                    onClick={() => setShowReview(true)}
                                    className="w-full py-4 px-8 rounded-xl border-2 border-[#7f13ec]/40 hover:border-[#7f13ec]/80 transition-all text-white font-bold text-base flex items-center justify-center gap-2 group glass-card"
                                >
                                    <span className="material-symbols-outlined text-[#7f13ec] group-hover:rotate-12 transition-transform">
                                        visibility
                                    </span>
                                    Review Answers
                                </button>

                                <button
                                    onClick={onNextLesson}
                                    className="w-full py-4 px-8 rounded-xl text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 group cursor-pointer transition-all"
                                    style={{
                                        background: 'linear-gradient(to right, #7c3aed, #c026d3)',
                                        boxShadow: '0 4px 24px rgba(127,19,236,0.3)'
                                    }}
                                >
                                    Next Lesson
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                                        arrow_forward
                                    </span>
                                </button>

                            </div>

                        </div>
                    </main>

                ) : (

                    /* REVIEW */

                    <div className="flex-1 overflow-auto custom-scrollbar">

                        <div className="max-w-4xl mx-auto px-6 pt-6 pb-20">

                            <div className="flex items-center justify-between mb-6 sticky top-0 bg-quiz-bg-dark py-4 px-6 -mx-6 mt-0 z-10">
                                <h2 className="text-xl font-bold text-white">Review Answers</h2>

                                <button
                                    onClick={() => setShowReview(false)}
                                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        arrow_back
                                    </span>
                                    <span className="text-sm">Trở về</span>
                                </button>
                            </div>

                            {questionHistory.length === 0 ? (

                                <div className="text-center py-12 text-white/40">
                                    <span className="material-symbols-outlined text-4xl">
                                        quiz
                                    </span>
                                    <p className="mt-2">Không có dữ liệu câu hỏi</p>
                                </div>

                            ) : (

                                <div className="flex flex-col gap-4">

                                    {questionHistory.map((entry, idx) => (

                                        <div key={entry.question?.id || idx} className="glass-card rounded-2xl p-5 flex flex-col gap-4">

                                            <div className="flex items-start gap-3">
                                                <span className="shrink-0 size-7 rounded-full bg-[#7f13ec]/20 border border-[#7f13ec]/40 flex items-center justify-center text-xs font-bold text-[#a78bfa]">
                                                    {idx + 1}
                                                </span>

                                                <p className="text-base font-semibold text-white leading-snug">
                                                    {entry.question?.content}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-2 pl-10">

                                                {(entry.question?.choices ?? []).map((choice) => {

                                                    const isSelected = entry.selectedChoiceId === choice.Id;

                                                    return (

                                                        <div
                                                            key={choice.Id}
                                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${isSelected
                                                                ? 'border-[#7f13ec]/60 bg-[#7f13ec]/15'
                                                                : 'border-white/10 bg-white/3'
                                                                }`}
                                                        >

                                                            <div className={`size-2.5 rounded-full shrink-0 ${isSelected
                                                                ? 'bg-[#7f13ec]'
                                                                : 'bg-white/20'
                                                                }`} />

                                                            <span className={`text-sm ${isSelected
                                                                ? 'text-white font-semibold'
                                                                : 'text-white/60'
                                                                }`}>
                                                                {choice.Content}
                                                            </span>

                                                            {isSelected && (
                                                                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-[#7f13ec]/30 text-[#c4b5fd]">
                                                                    Đã chọn
                                                                </span>
                                                            )}

                                                        </div>

                                                    );
                                                })}

                                                {entry.selectedChoiceId === null && (
                                                    <div className="flex items-center gap-2 text-xs text-yellow-400/70 mt-1">
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            timer_off
                                                        </span>
                                                        Không trả lời (hết giờ)
                                                    </div>
                                                )}

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>

                        {/* Footer */}

                        <footer className="relative z-10 w-full px-6 py-4 flex justify-center border-t border-white/5 shrink-0">
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    dashboard
                                </span>
                                <span className="text-sm font-bold uppercase tracking-widest">
                                    Back to Dashboard
                                </span>
                            </button>
                        </footer>

                    </div>
                )}

            </div>
        </div>
    );
};

export default QuizResultPage;