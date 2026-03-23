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
        <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            {mode === 'edit' ? 'Edit Question' : 'Add Question'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            Create or update one question with exactly one correct answer.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Question Content
                        </label>
                        <textarea
                            name="content"
                            value={form.content}
                            onChange={handleFormChange}
                            rows={4}
                            placeholder="Enter question content..."
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none resize-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Difficulty
                            </label>
                            <input
                                name="difficulty"
                                value={form.difficulty}
                                onChange={handleFormChange}
                                placeholder="Easy / Medium / Hard"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleFormChange}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-400"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Published">Published</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Param A
                            </label>
                            <input
                                name="paramA"
                                type="number"
                                step="any"
                                value={form.paramA}
                                onChange={handleFormChange}
                                placeholder="e.g. 1.0"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Param B
                            </label>
                            <input
                                name="paramB"
                                type="number"
                                step="any"
                                value={form.paramB}
                                onChange={handleFormChange}
                                placeholder="e.g. 0.2"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Param C
                            </label>
                            <input
                                name="paramC"
                                type="number"
                                step="any"
                                value={form.paramC}
                                onChange={handleFormChange}
                                placeholder="e.g. 0.25"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Explanation
                        </label>
                        <textarea
                            name="explanation"
                            value={form.explanation}
                            onChange={handleFormChange}
                            rows={3}
                            placeholder="Optional explanation..."
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none resize-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-slate-700">
                                Choices
                            </label>
                            <span className="text-xs text-slate-500">Select exactly one correct answer</span>
                        </div>

                        <div className="space-y-3">
                            {choices.map((choice, idx) => (
                                <div
                                    key={idx}
                                    className={`rounded-xl border px-4 py-4 ${idx === correctChoiceIndex
                                            ? 'border-emerald-300 bg-emerald-50'
                                            : 'border-slate-200 bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="radio"
                                            name="correctChoice"
                                            checked={idx === correctChoiceIndex}
                                            onChange={() => setCorrectChoiceIndex(idx)}
                                            className="mt-1"
                                        />

                                        <div className="w-full">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-bold uppercase text-slate-500">
                                                    Choice {String.fromCharCode(65 + idx)}
                                                </p>
                                                {idx === correctChoiceIndex && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                                                        Correct
                                                    </span>
                                                )}
                                            </div>

                                            <input
                                                type="text"
                                                value={choice.content}
                                                onChange={(e) => handleChoiceChange(idx, e.target.value)}
                                                placeholder={`Enter choice ${String.fromCharCode(65 + idx)}`}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-400 bg-white placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 disabled:opacity-60"
                        >
                            {submitting
                                ? (mode === 'edit' ? 'Updating...' : 'Creating...')
                                : (mode === 'edit' ? 'Update Question' : 'Create Question')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuestionEditorModal;