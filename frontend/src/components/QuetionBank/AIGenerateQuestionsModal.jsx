import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { bulkGenerateAIQuestions } from '../../services/questionBankService';
import { fetchCourseById } from '../../services/courseService';

const AIGenerateQuestionsModal = ({ open, onClose, onGenerated, bankId, courseId }) => {
    const [config, setConfig] = useState({
        count: 5,
        difficulty: 'Mixed'
    });
    const [lessons, setLessons] = useState([]);
    const [selectedLessonId, setSelectedLessonId] = useState('all');
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (open && courseId) {
            loadCourseLessons();
        }
    }, [open, courseId, loadCourseLessons]);

    const loadCourseLessons = useCallback(async () => {
        setLoadingLessons(true);
        try {
            const courseData = await fetchCourseById(courseId);
            // Flatten sections and lectures
            const allLessons = [];
            if (courseData.Sections) {
                courseData.Sections.forEach(section => {
                    if (section.Lectures) {
                        section.Lectures.forEach(lecture => {
                            allLessons.push({
                                id: lecture.Id,
                                title: lecture.Title,
                                sectionTitle: section.Title
                            });
                        });
                    }
                });
            }
            setLessons(allLessons);
        } catch (error) {
            console.error('Failed to load lessons:', error);
            toast.error('Could not load course lessons');
        } finally {
            setLoadingLessons(false);
        }
    }, [courseId]);

    if (!open) return null;

    const handleGenerate = async () => {
        setGenerating(true);
        const toastId = toast.loading('AI is crafting your questions...');

        try {
            const lessonIdParam = selectedLessonId === 'all' ? null : selectedLessonId;
            const result = await bulkGenerateAIQuestions(
                bankId,
                courseId,
                config.count,
                config.difficulty,
                lessonIdParam
            );

            toast.success(`Success! ${result.count} questions added to bank.`, { id: toastId });
            onGenerated();
            onClose();
        } catch (error) {
            console.error('AI Generation Error:', error);
            toast.error(error.error || 'Failed to generate questions. Please try again.', { id: toastId });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative h-32 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex flex-col items-center justify-center text-center p-6">
                   <div className="absolute top-4 right-4">
                        <button 
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                   </div>
                   <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-2 animate-pulse">
                        <span className="material-symbols-outlined text-4xl text-white">psychology</span>
                   </div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">AI Quiz Generator</h3>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Number of Questions</label>
                            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">{config.count} Qs</span>
                        </div>
                        <input 
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={config.count}
                            onChange={(e) => setConfig(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-600 uppercase">
                            <span>1</span>
                            <span>10</span>
                            <span>20</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Content Source</label>
                        <div className="relative">
                            <select
                                value={selectedLessonId}
                                onChange={(e) => setSelectedLessonId(e.target.value)}
                                disabled={loadingLessons}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-purple-500/50 appearance-none disabled:opacity-50 transition-all cursor-pointer"
                            >
                                <option value="all" className="bg-slate-900">Entire Course Content</option>
                                {lessons.map(lesson => (
                                    <option key={lesson.id} value={lesson.id} className="bg-slate-900">
                                        [{lesson.sectionTitle}] {lesson.title}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                {loadingLessons ? (
                                    <div className="w-4 h-4 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-sm text-slate-500">expand_more</span>
                                )}
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider italic">
                            {selectedLessonId === 'all' 
                                ? 'AI will use all available sections and lectures.' 
                                : 'AI will focus only on this specific lesson.'
                            }
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Target Difficulty</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Mixed', 'Easy', 'Medium', 'Hard'].map((diff) => (
                                <button
                                    key={diff}
                                    onClick={() => setConfig(prev => ({ ...prev, difficulty: diff }))}
                                    className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${
                                        config.difficulty === diff 
                                        ? 'bg-purple-500/20 border-purple-500 text-purple-400' 
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${
                                        diff === 'Easy' ? 'bg-emerald-500' :
                                        diff === 'Medium' ? 'bg-amber-500' :
                                        diff === 'Hard' ? 'bg-rose-500' : 'bg-blue-500'
                                    }`}></div>
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                        <span className="material-symbols-outlined text-blue-400">info</span>
                        <p className="text-xs text-blue-300 leading-relaxed italic">
                            AI will read your course lectures and materials to generate relevant questions. 
                            This process might take 10-20 seconds.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="flex-[2] px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-black hover:shadow-xl hover:shadow-purple-500/25 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {generating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">magic_button</span>
                                    <span>Start Generation</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIGenerateQuestionsModal;
