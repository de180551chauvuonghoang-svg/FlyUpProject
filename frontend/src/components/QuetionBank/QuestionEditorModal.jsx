import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    createQuestionBankQuestion,
    updateQuestionBankQuestion,
} from '../../services/questionBankService';

const buildDefaultChoices = () => [
    { content: '', orderIndex: 1 },
    { content: '', orderIndex: 2 },
    { content: '', orderIndex: 3 },
    { content: '', orderIndex: 4 },
];

const QuestionEditorModal = ({
    open,
    mode = 'create',
    bankId,
    initialData = null,
    onClose,
    onSaved,
}) => {
    const [form, setForm] = useState({
        content: '',
        difficulty: '',
        paramA: '',
        paramB: '',
        paramC: '',
        explanation: '',
        status: 'Draft',
    });
    const [choices, setChoices] = useState(buildDefaultChoices());
    const [correctChoiceIndex, setCorrectChoiceIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;

        if (mode === 'edit' && initialData) {
            const sortedChoices = [...(initialData.Choices || [])].sort(
                (a, b) => (a.OrderIndex ?? 0) - (b.OrderIndex ?? 0)
            );

            const paddedChoices = [...sortedChoices];
            while (paddedChoices.length < 4) {
                paddedChoices.push({
                    Content: '',
                    OrderIndex: paddedChoices.length + 1,
                });
            }

            const correctIndex = Math.max(
                0,
                paddedChoices.findIndex((choice) => choice.IsCorrect)
            );

            setForm({
                content: initialData.Content || '',
                difficulty: initialData.Difficulty || '',
                paramA: initialData.ParamA ?? '',
                paramB: initialData.ParamB ?? '',
                paramC: initialData.ParamC ?? '',
                explanation: initialData.Explanation || '',
                status: initialData.Status || 'Draft',
            });

            setChoices(
                paddedChoices.slice(0, 4).map((choice, index) => ({
                    id: choice.Id,
                    content: choice.Content || '',
                    orderIndex: choice.OrderIndex ?? index + 1,
                }))
            );
            setCorrectChoiceIndex(correctIndex >= 0 ? correctIndex : 0);
            return;
        }

        setForm({
            content: '',
            difficulty: '',
            paramA: '',
            paramB: '',
            paramC: '',
            explanation: '',
            status: 'Draft',
        });
        setChoices(buildDefaultChoices());
        setCorrectChoiceIndex(0);
    }, [open, mode, initialData]);

    if (!open) return null;

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleChoiceChange = (index, value) => {
        setChoices((prev) =>
            prev.map((choice, idx) =>
                idx === index ? { ...choice, content: value } : choice
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.content.trim()) {
            toast.error('Question content is required');
            return;
        }

        const payloadChoices = choices.map((choice, idx) => ({
            content: choice.content,
            orderIndex: idx + 1,
            isCorrect: idx === correctChoiceIndex,
        }));

        if (payloadChoices.some((choice) => !choice.content.trim())) {
            toast.error('All 4 choices must have content');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading(
            mode === 'edit' ? 'Updating question...' : 'Creating question...'
        );

        try {
            let saved;

            if (mode === 'edit' && initialData?.Id) {
                saved = await updateQuestionBankQuestion(bankId, initialData.Id, {
                    content: form.content,
                    difficulty: form.difficulty,
                    paramA: form.paramA,
                    paramB: form.paramB,
                    paramC: form.paramC,
                    explanation: form.explanation,
                    status: form.status,
                    choices: payloadChoices,
                });
            } else {
                saved = await createQuestionBankQuestion(bankId, {
                    content: form.content,
                    difficulty: form.difficulty,
                    paramA: form.paramA,
                    paramB: form.paramB,
                    paramC: form.paramC,
                    explanation: form.explanation,
                    status: form.status,
                    choices: payloadChoices,
                });
            }

            toast.success(
                mode === 'edit' ? 'Question updated successfully' : 'Question created successfully',
                { id: toastId }
            );

            onSaved(saved);
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to save question', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {mode === 'edit' ? 'Edit Question' : 'Add Question'}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Create or update one question with exactly one correct answer.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Content */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Question Content
                        </label>
                        <textarea
                            name="content"
                            value={form.content}
                            onChange={handleFormChange}
                            rows={4}
                            placeholder="Enter question content..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none"
                        />
                    </div>

                    {/* Difficulty and Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Difficulty
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">signal_cellular_alt</span>
                                <input
                                    name="difficulty"
                                    value={form.difficulty}
                                    onChange={handleFormChange}
                                    placeholder="Easy / Medium / Hard"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white text-sm outline-none placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Status
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">flag</span>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleFormChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white text-sm outline-none appearance-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
                                >
                                    <option value="Draft" className="bg-slate-900">Draft</option>
                                    <option value="Published" className="bg-slate-900">Published</option>
                                    <option value="Archived" className="bg-slate-900">Archived</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Params */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['paramA', 'paramB', 'paramC'].map((param, idx) => (
                            <div key={param}>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Param {String.fromCharCode(65 + idx)}
                                </label>
                                <input
                                    name={param}
                                    type="number"
                                    step="any"
                                    value={form[param]}
                                    onChange={handleFormChange}
                                    placeholder="e.g. 1.0"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Explanation */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Explanation
                        </label>
                        <textarea
                            name="explanation"
                            value={form.explanation}
                            onChange={handleFormChange}
                            rows={3}
                            placeholder="Explain the correct answer..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none"
                        />
                    </div>

                    {/* Choices */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Choices
                            </label>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                Select one correct answer
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {choices.map((choice, idx) => (
                                <div
                                    key={idx}
                                    className={`relative group rounded-2xl border transition-all duration-300 ${idx === correctChoiceIndex
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-start gap-4 p-5">
                                        <div className="relative mt-1">
                                            <input
                                                type="radio"
                                                name="correctChoice"
                                                checked={idx === correctChoiceIndex}
                                                onChange={() => setCorrectChoiceIndex(idx)}
                                                className="peer opacity-0 absolute inset-0 cursor-pointer z-10"
                                            />
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 flex items-center justify-center transition-all">
                                                <div className="w-2 h-2 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${idx === correctChoiceIndex ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                    Choice {String.fromCharCode(65 + idx)}
                                                </p>
                                                {idx === correctChoiceIndex && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                                        <span className="material-symbols-outlined text-xs">check_circle</span>
                                                        <span className="text-[9px] font-black uppercase tracking-tighter">Correct Answer</span>
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                type="text"
                                                value={choice.content}
                                                onChange={(e) => handleChoiceChange(idx, e.target.value)}
                                                placeholder={`Enter choice ${String.fromCharCode(65 + idx)}`}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none placeholder:text-slate-700 focus:border-purple-500/30 focus:bg-white/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10 sticky bottom-0 bg-slate-900/95 backdrop-blur-md pb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-2.5 rounded-xl text-white text-sm font-black bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">save</span>
                                    <span>{mode === 'edit' ? 'Update Question' : 'Create Question'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuestionEditorModal;