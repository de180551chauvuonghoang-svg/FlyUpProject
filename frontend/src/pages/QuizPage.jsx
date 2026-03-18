import React, { useState, useEffect, useRef, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { startCatQuiz, answerCatQuestion, finishCatQuiz } from '../services/quizService';

const ANSWER_CONFIGS = [
    { label: 'A', color: 'quiz-answer-red', icon: 'change_history' },
    { label: 'B', color: 'quiz-answer-blue', icon: 'pentagon' },
    { label: 'C', color: 'quiz-answer-yellow', icon: 'circle' },
    { label: 'D', color: 'quiz-answer-green', icon: 'square' },
];

const COLOR_MAP = {
    'quiz-answer-red': { border: 'border-l-[#e53e3e]', bg: 'bg-[#e53e3e]', hover: 'bg-[#e53e3e]/5', shadow: 'shadow-[#e53e3e]/20' },
    'quiz-answer-blue': { border: 'border-l-[#3182ce]', bg: 'bg-[#3182ce]', hover: 'bg-[#3182ce]/5', shadow: 'shadow-[#3182ce]/20' },
    'quiz-answer-yellow': { border: 'border-l-[#d69e2e]', bg: 'bg-[#d69e2e]', hover: 'bg-[#d69e2e]/5', shadow: 'shadow-[#d69e2e]/20' },
    'quiz-answer-green': { border: 'border-l-[#38a169]', bg: 'bg-[#38a169]', hover: 'bg-[#38a169]/5', shadow: 'shadow-[#38a169]/20' },
};

const TIMER_SECONDS = 45;

const QuizPage = ({ assignmentId, courseId, questionCount, onFinish, onBack }) => {
    const { accessToken, loading: authLoading } = useAuth();

    const [phase, setPhase] = useState('loading'); // loading | quiz | submitting
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedChoiceId, setSelectedChoiceId] = useState(null);

    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [responses, setResponses] = useState([]);
    const [selectedChoiceIds, setSelectedChoiceIds] = useState([]);
    const [currentTheta, setCurrentTheta] = useState(0);

    const [questionIndex, setQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
    const [isLoadingNext, setIsLoadingNext] = useState(false);

    const [questionHistory, setQuestionHistory] = useState([]);

    const timerRef = useRef(null);
    const totalTimeSpentRef = useRef(0);
    const quizStartThetaRef = useRef(0);

    const progress = questionCount > 0 ? Math.round((questionIndex / questionCount) * 100) : 0;

    const loadInitialQuestion = useCallback(async () => {
        if (!accessToken) {
            console.error('[QuizPage] No access token available');
            return;
        }

        setPhase('loading');

        try {
            const data = await startCatQuiz(
                {
                    assignmentId,
                    courseId,
                    questionCount,
                },
                accessToken
            );

            setCurrentQuestion(data.question ?? null);
            setCurrentTheta(data.currentTheta ?? 0);
            quizStartThetaRef.current = data.initialTheta ?? 0;
            setSelectedChoiceId(null);
            setAnsweredQuestions([]);
            setResponses([]);
            setSelectedChoiceIds([]);
            setQuestionHistory([]);
            setQuestionIndex(0);
            setTimeLeft(TIMER_SECONDS);
            totalTimeSpentRef.current = 0;
            setPhase('quiz');
        } catch (err) {
            console.error('[QuizPage] startCatQuiz error:', err);
        }
    }, [assignmentId, courseId, questionCount, accessToken]);

    useEffect(() => {
        if (authLoading) return;
        if (!accessToken) {
            console.error('[QuizPage] Authentication not ready or missing access token');
            return;
        }

        loadInitialQuestion();
    }, [authLoading, accessToken, loadInitialQuestion]);

    const handleNext = useCallback(async (timedOut = false) => {
        if (!currentQuestion || isLoadingNext) return;
        if (!accessToken) {
            console.error('[QuizPage] Missing access token during answer flow');
            return;
        }

        clearInterval(timerRef.current);
        setIsLoadingNext(true);

        const spentThisQuestion = TIMER_SECONDS - timeLeft;
        totalTimeSpentRef.current += spentThisQuestion;

        const selectedId = timedOut ? null : selectedChoiceId;

        const historyEntry = {
            question: currentQuestion,
            selectedChoiceId: selectedId,
        };

        try {
            const answerData = await answerCatQuestion(
                {
                    assignmentId,
                    courseId,
                    questionCount,
                    currentQuestionId: currentQuestion.question_id,
                    selectedChoiceId: selectedId,
                    answeredQuestions,
                    responses,
                    currentTheta,
                    timeSpentForQuestion: spentThisQuestion,
                },
                accessToken
            );

            const updatedAnsweredQuestions = answerData.answeredQuestions ?? [];
            const updatedResponses = answerData.responses ?? [];
            const updatedTheta = answerData.tempTheta ?? currentTheta;
            const updatedQuestionHistory = [...questionHistory, { ...historyEntry, isCorrect: answerData.isCorrect ?? false }];
            const updatedSelectedChoiceIds = [...selectedChoiceIds, selectedId];

            setAnsweredQuestions(updatedAnsweredQuestions);
            setResponses(updatedResponses);
            setCurrentTheta(updatedTheta);
            setQuestionHistory(updatedQuestionHistory);
            setSelectedChoiceIds(updatedSelectedChoiceIds);

            const newIndex = updatedAnsweredQuestions.length;
            setQuestionIndex(newIndex);

            if (answerData.isFinished) {
                setPhase('submitting');

                const finalResult = await finishCatQuiz(
                    {
                        assignmentId,
                        courseId,
                        questionCount,
                        answeredQuestions: updatedAnsweredQuestions,
                        responses: updatedResponses,
                        selectedChoiceIds: updatedSelectedChoiceIds,
                        timeSpentInSec: totalTimeSpentRef.current,
                        initialTheta: quizStartThetaRef.current,
                    },
                    accessToken
                );

                onFinish({
                    score: finalResult.mark ?? 0,
                    correctCount: finalResult.correctCount ?? 0,
                    totalQuestions: finalResult.totalQuestions ?? questionCount,
                    timeSpent: finalResult.timeSpentInSec ?? totalTimeSpentRef.current,
                    finalTheta: finalResult.finalTheta ?? updatedTheta,
                    questionHistory: updatedQuestionHistory,
                    submissionId: finalResult.submissionId,
                    passed: finalResult.passed,
                });

                return;
            }

            setCurrentQuestion(answerData.nextQuestion ?? null);
            setSelectedChoiceId(null);
            setTimeLeft(TIMER_SECONDS);
        } catch (err) {
            console.error('[QuizPage] handleNext error:', err);
        } finally {
            setIsLoadingNext(false);
        }
    }, [
        currentQuestion,
        isLoadingNext,
        accessToken,
        timeLeft,
        selectedChoiceId,
        assignmentId,
        courseId,
        questionCount,
        answeredQuestions,
        responses,
        currentTheta,
        questionHistory,
        selectedChoiceIds,
        onFinish,
    ]);

    useEffect(() => {
        if (phase !== 'quiz') return;

        clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    handleNext(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [phase, questionIndex, handleNext]);

    const timerPercent = (timeLeft / TIMER_SECONDS) * 100;
    const timerColor = timeLeft > 15 ? '#7f13ec' : timeLeft > 7 ? '#d69e2e' : '#e53e3e';

    if (authLoading || phase === 'loading' || (phase === 'quiz' && !currentQuestion)) {
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
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] nebula-glow-purple rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] nebula-glow-fuchsia rounded-full"></div>
            </div>

            <header className="relative z-10 w-full px-6 lg:px-16 py-4 border-b border-white/10 glass-card">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="material-symbols-outlined text-[#7f13ec] text-2xl">rocket_launch</span>
                        <h2 className="text-lg font-bold tracking-tight hidden sm:block">
                            QUIZ<span className="text-[#7f13ec]">Fly</span>
                        </h2>
                    </div>

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

                    <button
                        onClick={onBack}
                        className="shrink-0 size-9 rounded-full glass-card flex items-center justify-center text-white/40 hover:text-white transition-colors"
                        title="Thoát"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-4xl mx-auto w-full gap-8 overflow-y-auto">
                <div className="flex flex-col items-center gap-6 animate-fadeIn w-full">
                    <div className="relative group shrink-0">
                        <div
                            className="absolute inset-0 rounded-full scale-110"
                            style={{ background: `${timerColor}30`, filter: 'blur(20px)' }}
                        ></div>
                        <div
                            className="relative size-24 rounded-full border-4 flex items-center justify-center bg-quiz-bg-dark/80 backdrop-blur-md"
                            style={{ borderColor: `${timerColor}40` }}
                        >
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-3xl font-bold" style={{ color: timerColor }}>{timeLeft}</span>
                                <span className="text-[10px] uppercase text-white/50 tracking-tighter">SEC</span>
                            </div>
                            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 96 96">
                                <circle cx="48" cy="48" fill="transparent" r="44" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                <circle
                                    cx="48"
                                    cy="48"
                                    fill="transparent"
                                    r="44"
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

                    <h1 className="text-center text-2xl md:text-3xl font-bold leading-tight max-w-3xl tracking-tight animate-fadeIn">
                        {currentQuestion?.content}
                    </h1>
                </div>

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
                                    style={isSelected ? { background: 'rgba(127,19,236,0.2)', opacity: 1 } : {}}
                                >
                                    <div className={`absolute inset-0 ${c.hover} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                    <div className={`flex-shrink-0 size-14 rounded-lg ${c.bg} flex items-center justify-center shadow-lg ${c.shadow}`}>
                                        <span
                                            className="material-symbols-outlined text-white text-3xl"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            {cfg.icon}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                        <span className="text-white/50 text-xs font-bold uppercase tracking-widest">
                                            Option {cfg.label}
                                        </span>
                                        <p className="text-base font-semibold text-white leading-snug">
                                            {choice.Content}
                                        </p>
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

                <button
                    onClick={() => handleNext(false)}
                    disabled={isLoadingNext}
                    className="mt-2 px-10 py-3.5 rounded-xl font-bold text-base text-white transition-all flex items-center gap-2 group disabled:opacity-50"
                    style={{
                        background: 'linear-gradient(to right, #7c3aed, #c026d3)',
                        boxShadow: '0 0 20px rgba(127,19,236,0.4)',
                    }}
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