import React, { useState, useEffect, useRef, useCallback } from 'react';
import { catNextQuestion, catSubmit } from '../services/quizService';

const ANSWER_CONFIGS = [
    { label: 'A', color: 'quiz-answer-red', icon: 'change_history' },
    { label: 'B', color: 'quiz-answer-blue', icon: 'pentagon' },
    { label: 'C', color: 'quiz-answer-yellow', icon: 'circle' },
    { label: 'D', color: 'quiz-answer-green', icon: 'square' },
];

const COLOR_MAP = {
    'quiz-answer-red': { border: 'border-l-[#e53e3e]', bg: 'bg-[#e53e3e]', hover: 'bg-[#e53e3e]/5', shadow: 'shadow-[#e53e3e]/20', selected: 'bg-[#e53e3e]/20 border-[#e53e3e]' },
    'quiz-answer-blue': { border: 'border-l-[#3182ce]', bg: 'bg-[#3182ce]', hover: 'bg-[#3182ce]/5', shadow: 'shadow-[#3182ce]/20', selected: 'bg-[#3182ce]/20 border-[#3182ce]' },
    'quiz-answer-yellow': { border: 'border-l-[#d69e2e]', bg: 'bg-[#d69e2e]', hover: 'bg-[#d69e2e]/5', shadow: 'shadow-[#d69e2e]/20', selected: 'bg-[#d69e2e]/20 border-[#d69e2e]' },
    'quiz-answer-green': { border: 'border-l-[#38a169]', bg: 'bg-[#38a169]', hover: 'bg-[#38a169]/5', shadow: 'shadow-[#38a169]/20', selected: 'bg-[#38a169]/20 border-[#38a169]' },
};

const TIMER_SECONDS = 45;

const QuizPage = ({ assignmentId, courseId, userId, questionCount, onFinish, onBack }) => {
    const [phase, setPhase] = useState('loading'); // loading | quiz | submitting
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedChoiceId, setSelectedChoiceId] = useState(null);
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [responses, setResponses] = useState([]);
    const [currentTheta, setCurrentTheta] = useState(0);
    const [questionIndex, setQuestionIndex] = useState(0); // 0-based
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
    const [totalTimeSpent, setTotalTimeSpent] = useState(0);
    const [isLoadingNext, setIsLoadingNext] = useState(false);
    // Track full question data for review
    const [questionHistory, setQuestionHistory] = useState([]); // [{question, choices, selectedChoiceId}]

    const timerRef = useRef(null);
    const timeSpentRef = useRef(0);

    const progress = questionCount > 0 ? Math.round((questionIndex / questionCount) * 100) : 0;

    // Fetch next question from CAT
    const fetchNextQuestion = useCallback(async (answeredQs, resps, theta, isNew = false) => {
        setIsLoadingNext(true);
        try {
            const payload = {
                user_id: userId,
                course_id: courseId,
                assignment_id: assignmentId,
                answered_questions: answeredQs,
                last_response: resps.length > 0 ? [resps[resps.length - 1]] : [],
                current_theta: theta,
            };
            const data = await catNextQuestion(payload);
            if (data.next_question) {
                setCurrentQuestion(data.next_question);
                setCurrentTheta(data.temp_theta ?? theta);
                setSelectedChoiceId(null);
                setTimeLeft(TIMER_SECONDS);
                if (isNew) setPhase('quiz');
            }
        } catch (err) {
            console.error('[QuizPage] fetchNextQuestion error:', err);
        } finally {
            setIsLoadingNext(false);
        }
    }, [userId, courseId, assignmentId]);

    // Initial load
    useEffect(() => {
        fetchNextQuestion([], [], 0, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Timer
    useEffect(() => {
        if (phase !== 'quiz') return;
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    handleNext(true); // auto-next when time is up
                    return 0;
                }
                timeSpentRef.current += 1;
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, questionIndex]);

    const handleNext = useCallback(async (timedOut = false) => {
        clearInterval(timerRef.current);

        const isAnswered = !timedOut && selectedChoiceId !== null;
        const response = isAnswered ? 1 : 0;

        // Record history entry
        const historyEntry = {
            question: currentQuestion,
            selectedChoiceId: isAnswered ? selectedChoiceId : null,
        };

        const newAnswered = [...answeredQuestions, currentQuestion.question_id];
        const newResponses = [...responses, response];
        const newHistory = [...questionHistory, historyEntry];
        const newIndex = questionIndex + 1;

        setAnsweredQuestions(newAnswered);
        setResponses(newResponses);
        setQuestionHistory(newHistory);
        setQuestionIndex(newIndex);
        setTotalTimeSpent((prev) => prev + (TIMER_SECONDS - timeLeft));

        if (newIndex >= questionCount) {
            // Done — submit
            setPhase('submitting');
            try {
                const result = await catSubmit({
                    user_id: userId,
                    course_id: courseId,
                    assignment_id: assignmentId,
                    answered_questions: newAnswered,
                    responses: newResponses,
                    smoothing_alpha: 0.2,
                });
                onFinish({
                    score: result.correct ? Math.round((result.correct / result.total) * 10 * 10) / 10 : 0,
                    correctCount: result.correct ?? 0,
                    totalQuestions: result.total ?? questionCount,
                    timeSpent: timeSpentRef.current + (TIMER_SECONDS - timeLeft),
                    finalTheta: result.final_theta,
                    questionHistory: newHistory,
                });
            } catch (err) {
                console.error('[QuizPage] catSubmit error:', err);
                onFinish({
                    score: 0,
                    correctCount: 0,
                    totalQuestions: questionCount,
                    timeSpent: timeSpentRef.current,
                    questionHistory: newHistory,
                });
            }
        } else {
            await fetchNextQuestion(newAnswered, newResponses, currentTheta);
        }
    }, [selectedChoiceId, currentQuestion, answeredQuestions, responses, questionHistory, questionIndex, questionCount, currentTheta, timeLeft, userId, courseId, assignmentId, onFinish, fetchNextQuestion]);

    // Timer ring progress
    const timerPercent = (timeLeft / TIMER_SECONDS) * 100;
    const timerColor = timeLeft > 15 ? '#7f13ec' : timeLeft > 7 ? '#d69e2e' : '#e53e3e';

    if (phase === 'loading' || (phase === 'quiz' && !currentQuestion)) {
        return (
            <div className="fixed inset-0 z-50 bg-quiz-bg-dark font-quiz text-white flex items-center justify-center">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] nebula-glow-purple rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] nebula-glow-fuchsia rounded-full"></div>
                </div>
                <div className="relative flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-[#7f13ec] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/60 font-medium">Đang tải câu hỏi...</p>
                </div>
            </div>
        );
    }

    if (phase === 'submitting') {
        return (
            <div className="fixed inset-0 z-50 bg-quiz-bg-dark font-quiz text-white flex items-center justify-center">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] nebula-glow-purple rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] nebula-glow-fuchsia rounded-full"></div>
                </div>
                <div className="relative flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-[#7f13ec] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/60 font-medium">Đang tính kết quả...</p>
                </div>
            </div>
        );
    }

    const choices = currentQuestion?.choices ?? [];

    return (
        <div className="fixed inset-0 z-50 bg-quiz-bg-dark font-quiz text-white overflow-hidden flex flex-col">
            {/* Nebula background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] nebula-glow-purple rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] nebula-glow-fuchsia rounded-full"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 w-full px-6 lg:px-16 py-4 border-b border-white/10 glass-card">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="material-symbols-outlined text-[#7f13ec] text-2xl">rocket_launch</span>
                        <h2 className="text-lg font-bold tracking-tight hidden sm:block">
                            QUIZ<span className="text-[#7f13ec]">Fly</span>
                        </h2>
                    </div>

                    {/* Progress */}
                    <div className="flex-1 max-w-xl flex flex-col gap-1.5">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                                Câu {questionIndex + 1} / {questionCount}
                            </span>
                            <span className="text-xs font-bold text-[#7f13ec]">{progress}% Hoàn thành</span>
                        </div>
                        <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%`, background: 'linear-gradient(to right, #7f13ec, #d946ef)' }}
                            ></div>
                        </div>
                    </div>

                    {/* Back button */}
                    <button
                        onClick={onBack}
                        className="shrink-0 size-9 rounded-full glass-card flex items-center justify-center text-white/40 hover:text-white transition-colors"
                        title="Thoát"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-4xl mx-auto w-full gap-8 overflow-y-auto">
                {/* Timer + Question */}
                <div className="flex flex-col items-center gap-6 animate-fadeIn w-full">
                    {/* Timer */}
                    <div className="relative group shrink-0">
                        <div className="absolute inset-0 rounded-full scale-110" style={{ background: `${timerColor}30`, filter: 'blur(20px)' }}></div>
                        <div className="relative size-24 rounded-full border-4 flex items-center justify-center bg-quiz-bg-dark/80 backdrop-blur-md" style={{ borderColor: `${timerColor}40` }}>
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-3xl font-bold" style={{ color: timerColor }}>{timeLeft}</span>
                                <span className="text-[10px] uppercase text-white/50 tracking-tighter">SEC</span>
                            </div>
                            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 96 96">
                                <circle cx="48" cy="48" fill="transparent" r="44" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                <circle
                                    cx="48" cy="48" fill="transparent" r="44"
                                    stroke={timerColor}
                                    strokeWidth="4"
                                    strokeDasharray="276"
                                    strokeDashoffset={276 - (276 * timerPercent) / 100}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Question text */}
                    <h1 className="text-center text-2xl md:text-3xl font-bold leading-tight max-w-3xl tracking-tight animate-fadeIn">
                        {currentQuestion?.content}
                    </h1>
                </div>

                {/* Answer Grid */}
                {isLoadingNext ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-2 border-[#7f13ec] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {choices.slice(0, 4).map((choice, idx) => {
                            const cfg = ANSWER_CONFIGS[idx] || ANSWER_CONFIGS[0];
                            const c = COLOR_MAP[cfg.color];
                            const isSelected = selectedChoiceId === choice.Id;
                            return (
                                <button
                                    key={choice.Id}
                                    onClick={() => setSelectedChoiceId(choice.Id)}
                                    className={`group relative flex items-center p-5 gap-5 rounded-xl transition-all duration-200 hover:scale-[1.015] active:scale-95 glass-card overflow-hidden text-left border-l-8 ${c.border} ${isSelected ? 'ring-2 ring-white/30' : ''}`}
                                    style={isSelected ? { background: `var(--color-${cfg.color}, rgba(127,19,236,0.2))`, opacity: 1 } : {}}
                                >
                                    <div className={`absolute inset-0 ${c.hover} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                    <div className={`flex-shrink-0 size-14 rounded-lg ${c.bg} flex items-center justify-center shadow-lg ${c.shadow}`}>
                                        <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                        <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Option {cfg.label}</span>
                                        <p className="text-base font-semibold text-white leading-snug">{choice.Content}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="shrink-0 size-5 rounded-full bg-white flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[14px] text-black">check</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Next Button */}
                <button
                    onClick={() => handleNext(false)}
                    disabled={isLoadingNext}
                    className="mt-2 px-10 py-3.5 rounded-xl font-bold text-base text-white transition-all flex items-center gap-2 group disabled:opacity-50"
                    style={{ background: 'linear-gradient(to right, #7c3aed, #c026d3)', boxShadow: '0 0 20px rgba(127,19,236,0.4)' }}
                >
                    {questionIndex + 1 >= questionCount ? 'Nộp bài' : 'Câu tiếp theo'}
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                        {questionIndex + 1 >= questionCount ? 'done_all' : 'arrow_forward'}
                    </span>
                </button>
            </main>
        </div>
    );
};

export default QuizPage;
