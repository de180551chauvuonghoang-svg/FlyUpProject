import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSubmissionHistory } from '../services/quizService';

const QuizPreTestPage = ({ assignment, userId, onStart, onBack }) => {
    const questionCount = 10;

    const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
        queryKey: ['submissionHistory', assignment?.Id, userId],
        queryFn: () => fetchSubmissionHistory(assignment?.Id, userId),
        enabled: !!assignment?.Id && !!userId,
    });

    const estimatedMinutes = Math.ceil((questionCount * 45) / 60);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const isPassed = (mark, gradeToPass) => mark >= gradeToPass;

    return (
        <div className="fixed inset-0 z-50 bg-quiz-bg-dark font-quiz text-white overflow-y-auto">
            {/* Nebula background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] nebula-glow-purple rounded-full"></div>
                <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] nebula-glow-fuchsia rounded-full"></div>
            </div>

            <div className="relative max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-full glass-card flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/40">Assignment</p>
                        <h1 className="text-2xl font-extrabold tracking-tight text-white">{assignment?.Name}</h1>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="glass-card rounded-2xl p-5 flex flex-col items-center gap-2">
                        <div className="size-11 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                            <span className="material-symbols-outlined text-violet-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{assignment?.QuestionCount}</p>
                        <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Tổng câu hỏi</p>
                    </div>
                    <div className="glass-card rounded-2xl p-5 flex flex-col items-center gap-2">
                        <div className="size-11 rounded-xl bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                            <span className="material-symbols-outlined text-fuchsia-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>target</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{assignment?.GradeToPass}/10</p>
                        <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Điểm để pass</p>
                    </div>
                    <div className="glass-card rounded-2xl p-5 flex flex-col items-center gap-2">
                        <div className="size-11 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                            <span className="material-symbols-outlined text-cyan-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{estimatedMinutes} phút</p>
                        <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Thời gian</p>
                    </div>
                </div>

                {/* Quiz info */}
                <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
                    <div className="size-14 rounded-xl bg-quiz-primary/20 border border-quiz-primary/30 flex items-center justify-center shrink-0">
                        <span className="text-xl font-extrabold text-white">{questionCount}</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Số câu hỏi mỗi lần làm</h3>
                        <p className="text-xs text-white/40 mt-0.5">Mỗi câu 45 giây · CAT sẽ chọn câu phù hợp với trình độ của bạn từ ngân hàng câu hỏi</p>
                    </div>
                </div>

                {/* Submission History */}
                <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-white/60 text-[20px]">history</span>
                        Lịch sử làm bài
                    </h3>
                    {submissionsLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <div className="w-6 h-6 border-2 border-quiz-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-6">
                            <span className="material-symbols-outlined text-3xl text-white/20">assignment_late</span>
                            <p className="text-white/40 text-sm mt-2">Bạn chưa làm bài tập này lần nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-white/10">
                                        <th className="pb-3 text-white/40 font-semibold text-xs uppercase tracking-wider">Ngày làm</th>
                                        <th className="pb-3 text-white/40 font-semibold text-xs uppercase tracking-wider text-center">Thời gian</th>
                                        <th className="pb-3 text-white/40 font-semibold text-xs uppercase tracking-wider text-center">Điểm</th>
                                        <th className="pb-3 text-white/40 font-semibold text-xs uppercase tracking-wider text-center">Kết quả</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {submissions.map((sub) => {
                                        const passed = isPassed(sub.Mark, sub.Assignments?.GradeToPass ?? 8);
                                        return (
                                            <tr key={sub.Id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 text-white/70">{formatDate(sub.CreationTime)}</td>
                                                <td className="py-3 text-white/70 text-center">{formatTime(sub.TimeSpentInSec)}</td>
                                                <td className="py-3 text-center font-bold text-white">{sub.Mark?.toFixed(1)}</td>
                                                <td className="py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${passed
                                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                        }`}>
                                                        <span className={`size-1.5 rounded-full ${passed ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                                        {passed ? 'Passed' : 'Failed'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Start Button */}
                <button
                    onClick={() => onStart(questionCount)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all text-white font-extrabold text-lg shadow-lg shadow-quiz-primary/30 flex items-center justify-center gap-3 group"
                >
                    <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">rocket_launch</span>
                    Bắt đầu làm bài · {questionCount} câu · ~{estimatedMinutes} phút
                </button>
            </div>
        </div>
    );
};

export default QuizPreTestPage;
