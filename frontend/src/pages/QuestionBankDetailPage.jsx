import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import QuestionEditorModal from '../components/QuetionBank/QuestionEditorModal';
import AIGenerateQuestionsModal from '../components/QuetionBank/AIGenerateQuestionsModal';
import toast from 'react-hot-toast';
import { fetchAssignmentsByQuestionBank } from '../services/assignmentSnapshotService';
import {
    fetchQuestionBankDetail,
    fetchQuestionBankQuestions,
    deleteQuestionBankQuestion,
    publishQuestionBank,
    unpublishQuestionBank,
    updateQuestionBank,
    archiveQuestionBank,
    restoreQuestionBank,
} from '../services/questionBankService';
import InstructorLayout from '../components/InstructorLayout';

const StatusBadge = ({ status }) => {
    const normalized = String(status || '').toLowerCase();
    const classes = {
        draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border backdrop-blur-md ${classes[normalized] || classes.draft}`}>
            {status}
        </span>
    );
};

const VisibilityBadge = ({ isPublic }) => {
    return (
        <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border backdrop-blur-md ${isPublic
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                }`}
        >
            {isPublic ? 'Public' : 'Private'}
        </span>
    );
};

const ChoiceBadge = ({ isCorrect }) => {
    return (
        <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${isCorrect
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-white/5 text-slate-500 border-white/10'
                }`}
        >
            {isCorrect ? 'Correct' : 'Choice'}
        </span>
    );
};

const formatDateTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('vi-VN');
};

const QuestionBankDetailPage = () => {
    const { id } = useParams();
    const [bank, setBank] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loadingBank, setLoadingBank] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [isAIGenOpen, setIsAIGenOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [linkedAssignments, setLinkedAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    const [isEditBankOpen, setIsEditBankOpen] = useState(false);
    const [editBankForm, setEditBankForm] = useState({
        name: '',
        description: '',
    });

    const loadLinkedAssignments = useCallback(async () => {
        setLoadingAssignments(true);
        try {
            const data = await fetchAssignmentsByQuestionBank(id);
            setLinkedAssignments(data);
        } catch (error) {
            toast.error(error.message || 'Failed to load linked assignments');
        } finally {
            setLoadingAssignments(false);
        }
    }, [id]);

    const handleDeleteQuestion = async (questionId) => {
        const toastId = toast.loading('Deleting question...');
        try {
            await deleteQuestionBankQuestion(id, questionId);
            toast.success('Question deleted', { id: toastId });
            setConfirmDeleteId(null);
            loadBank();
            loadQuestions();
        } catch (error) {
            toast.error(error.message || 'Failed to delete question', { id: toastId });
            setConfirmDeleteId(null);
        }
    };

    const handlePublish = async () => {
        // Client-side pre-validation
        const publishedQs = questions.filter(q => String(q.Status || '').trim() === 'Published');
        const total = publishedQs.length;
        if (total < 10) {
            toast.error(`Question Bank phải có ít nhất 10 câu Published (hiện có ${total} câu)`);
            return;
        }
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        publishedQs.forEach(q => { if (q.Difficulty in counts) counts[q.Difficulty]++; });
        const issues = Object.entries(counts).filter(([, v]) => v < 2).map(([d, v]) => `${d} (cần 2, có ${v})`);
        if (issues.length > 0) {
            toast.error(`Mỗi cấp độ phải có ít nhất 2 câu Published. Chưa đủ: ${issues.join('; ')}`);
            return;
        }

        const toastId = toast.loading('Publishing question bank...');
        try {
            await publishQuestionBank(id);
            toast.success('Question bank published', { id: toastId });
            loadBank();
            loadQuestions();
        } catch (error) {
            toast.error(error.message || 'Failed to publish question bank', { id: toastId });
        }
    };

    const handleUnpublish = async () => {
        const toastId = toast.loading('Unpublishing question bank...');
        try {
            await unpublishQuestionBank(id);
            toast.success('Question bank moved back to draft', { id: toastId });
            loadBank();
            loadQuestions();
        } catch (error) {
            toast.error(error.message || 'Failed to unpublish question bank', { id: toastId });
        }
    };

    const loadBank = useCallback(async () => {
        setLoadingBank(true);
        try {
            const data = await fetchQuestionBankDetail(id);
            setBank(data);
        } catch (error) {
            setError(error.message || 'Failed to load question bank');
        } finally {
            setLoadingBank(false);
        }
    }, [id]);

    const loadQuestions = useCallback(async () => {
        setLoadingQuestions(true);
        try {
            const data = await fetchQuestionBankQuestions(id);
            setQuestions(data);
        } catch (error) {
            toast.error(error.message || 'Failed to load questions');
        } finally {
            setLoadingQuestions(false);
        }
    }, [id]);

    useEffect(() => {
        loadBank();
        loadQuestions();
    }, [loadBank, loadQuestions]);

    useEffect(() => {
        if (!id) return;
        loadLinkedAssignments();
    }, [id, loadLinkedAssignments]);

    useEffect(() => {
        if (!bank) return;

        setEditBankForm({
            name: bank.Name || '',
            description: bank.Description || '',
        });
    }, [bank]);

    const handleUpdateBank = async (e) => {
        e.preventDefault();

        const toastId = toast.loading('Updating question bank...');
        try {
            await updateQuestionBank(id, {
                name: editBankForm.name,
                description: editBankForm.description,
            });

            toast.success('Question bank updated', { id: toastId });
            setIsEditBankOpen(false);
            loadBank();
        } catch (error) {
            toast.error(error.message || 'Failed to update question bank', { id: toastId });
        }
    };

    const handleArchiveBank = async () => {
        const confirmed = window.confirm('Archive this question bank? It will no longer be usable for new assignment snapshots.');
        if (!confirmed) return;

        const toastId = toast.loading('Archiving question bank...');
        try {
            await archiveQuestionBank(id);
            toast.success('Question bank archived', { id: toastId });
            loadBank();
        } catch (error) {
            toast.error(error.message || 'Failed to archive question bank', { id: toastId });
        }
    };

    const handleRestoreBank = async () => {
        const toastId = toast.loading('Restoring question bank...');
        try {
            await restoreQuestionBank(id);
            toast.success('Question bank restored to draft', { id: toastId });
            loadBank();
        } catch (error) {
            toast.error(error.message || 'Failed to restore question bank', { id: toastId });
        }
    };

    if (loadingBank) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !bank) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                    <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
                    <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                    <p className="text-slate-400 mb-6">{error || 'Bank not found'}</p>
                    <Link to="/instructor/question-banks" className="px-6 py-2 bg-purple-500 text-white rounded-lg font-bold">Back to Banks</Link>
                </div>
            </div>
        );
    }

    return (
        <InstructorLayout
            title={bank.Name}
            subtitle={bank.Description || "Question Bank Detail"}
            actions={
                <div className="flex gap-3">
                    {bank.IsPublic ? (
                        <button onClick={handleUnpublish} className="px-4 py-2 border border-white/10 bg-white/5 text-slate-300 font-bold rounded-lg hover:bg-white/10 transition-all">Unpublish</button>
                    ) : (
                        <button onClick={handlePublish} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">Publish</button>
                    )}

                    {bank.Status === 'Archived' ? (
                        <button
                            type="button"
                            onClick={handleRestoreBank}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                        >
                            Restore
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleArchiveBank}
                            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700"
                        >
                            Archive
                        </button>
                    )}
                    <button onClick={() => setIsAIGenOpen(true)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">psychology</span> Generate with AI
                    </button>
                    <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">add</span> Add Question
                    </button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* Info Bar */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined text-sm text-purple-400">school</span>
                        <span className="font-bold">{bank.CourseTitle || "No Course"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={bank.Status} />
                        <VisibilityBadge isPublic={bank.IsPublic} />
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined text-sm text-purple-400">quiz</span>
                        <span className="font-bold">{bank.QuestionCount} Questions</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <span>Updated: {formatDateTime(bank.LastModificationTime)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Left Stats/Actions */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/instructor/create-assignment-from-bank?courseId=${bank.CourseId}&sourceQuestionBankId=${bank.Id}`)}
                                    disabled={!bank?.IsPublic}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                    <span className="material-symbols-outlined">assignment_add</span>
                                    Create Assignment
                                </button>
                                <button
                                    onClick={() => setIsEditBankOpen(true)}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-all text-left"
                                >
                                    <span className="material-symbols-outlined">edit</span>
                                    Edit Bank Info
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-lg font-bold text-white mb-4">Linked Assignments</h3>
                            {loadingAssignments ? (
                                <div className="w-6 h-6 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto my-4"></div>
                            ) : linkedAssignments.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-4">No assignments yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {linkedAssignments.map(a => (
                                        <div key={a.Id} onClick={() => navigate(`/instructor/assignments/${a.Id}/preview`)} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 cursor-pointer transition-all">
                                            <p className="text-sm font-bold text-slate-300 truncate">{a.Name}</p>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{a.QuestionCount} Qs · {a.SubmissionCount} Subs</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Publish Readiness */}
                        {bank.Status !== 'Published' && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-amber-400">rule</span>
                                    Publish Readiness
                                </h3>
                                {(() => {
                                    const publishedQs = questions.filter(q => String(q.Status || '').trim() === 'Published');
                                    const total = publishedQs.length;
                                    const counts = { Easy: 0, Medium: 0, Hard: 0 };
                                    publishedQs.forEach(q => { if (q.Difficulty in counts) counts[q.Difficulty]++; });
                                    const totalOk = total >= 10;
                                    const diffColors = { Easy: 'emerald', Medium: 'amber', Hard: 'rose' };
                                    return (
                                        <div className="space-y-3">
                                            <div className={`flex items-center justify-between p-2 rounded-lg ${totalOk ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                                <span className="text-xs font-bold text-slate-400">Total Published</span>
                                                <span className={`text-xs font-black ${totalOk ? 'text-emerald-400' : 'text-rose-400'}`}>{total}/10</span>
                                            </div>
                                            {Object.entries(counts).map(([diff, count]) => {
                                                const ok = count >= 2;
                                                const color = diffColors[diff];
                                                return (
                                                    <div key={diff} className={`flex items-center justify-between p-2 rounded-lg ${ok ? `bg-${color}-500/10` : 'bg-rose-500/10'}`}>
                                                        <span className="text-xs font-bold text-slate-400">{diff}</span>
                                                        <span className={`text-xs font-black ${ok ? `text-${color}-400` : 'text-rose-400'}`}>{count}/2</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Questions List */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Questions</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{questions.length} TOTAL</p>
                        </div>

                        {loadingQuestions ? (
                            <div className="flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-20 text-center">
                                <span className="material-symbols-outlined text-6xl text-slate-700 block mb-4">quiz</span>
                                <h3 className="text-xl font-bold text-white">No questions found</h3>
                                <p className="text-slate-400 mt-2 mb-6">Start building your bank by adding your first question.</p>
                                <button onClick={() => setIsCreateOpen(true)} className="px-6 py-2 bg-purple-500 text-white rounded-lg font-bold">Add First Question</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {questions.map((question, index) => (
                                    <div key={question.Id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h3 className="text-lg font-bold text-white leading-relaxed">{question.Content}</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            <StatusBadge status={question.Status || 'Draft'} />
                                                            {question.Difficulty && (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-purple-500/30 bg-purple-500/10 text-purple-300">
                                                                    {question.Difficulty}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Choice Grid */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                                            {question.Choices.map((choice, cIdx) => (
                                                                <div key={choice.Id} className={`p-4 rounded-xl border transition-all ${choice.IsCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                                                {String.fromCharCode(65 + cIdx)}
                                                                            </span>
                                                                            <p className="text-sm text-slate-300">{choice.Content}</p>
                                                                        </div>
                                                                        <ChoiceBadge isCorrect={choice.IsCorrect} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Params and Explanation */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {['ParamA', 'ParamB', 'ParamC'].map(p => (
                                                                <div key={p} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{p}</p>
                                                                    <p className="text-sm font-bold text-slate-400">{question[p] ?? '-'}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {question.Explanation && (
                                                            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                                                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">Explanation</p>
                                                                <p className="text-sm text-slate-400 leading-relaxed italic">{question.Explanation}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <button onClick={() => setEditingQuestion(question)} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"><span className="material-symbols-outlined text-lg">edit</span></button>
                                                    <button onClick={() => setConfirmDeleteId(question.Id)} className="p-2 text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all"><span className="material-symbols-outlined text-lg">delete</span></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <QuestionEditorModal
                open={isCreateOpen}
                mode="create"
                bankId={id}
                onClose={() => setIsCreateOpen(false)}
                onSaved={() => { loadBank(); loadQuestions(); }}
            />
            <AIGenerateQuestionsModal
                open={isAIGenOpen}
                bankId={id}
                courseId={bank?.CourseId}
                onClose={() => setIsAIGenOpen(false)}
                onGenerated={() => { loadBank(); loadQuestions(); }}
            />
            <QuestionEditorModal
                open={!!editingQuestion}
                mode="edit"
                bankId={id}
                initialData={editingQuestion}
                onClose={() => setEditingQuestion(null)}
                onSaved={() => { loadBank(); loadQuestions(); }}
            />

            {/* Delete Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-3xl">delete_forever</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Question?</h3>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">This will permanently remove the question from this bank. This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-300 font-bold rounded-xl hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={() => handleDeleteQuestion(confirmDeleteId)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {isEditBankOpen && (
                <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Edit Bank Info</h3>
                            <button
                                type="button"
                                onClick={() => setIsEditBankOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateBank} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={editBankForm.name}
                                    onChange={(e) =>
                                        setEditBankForm((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="Enter bank name..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">
                                    Description
                                </label>
                                <textarea
                                    rows={4}
                                    value={editBankForm.description}
                                    onChange={(e) =>
                                        setEditBankForm((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                    placeholder="Enter brief description..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50 transition-all resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditBankOpen(false)}
                                    className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </InstructorLayout>
    );
};

export default QuestionBankDetailPage;
