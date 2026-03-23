import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QuestionEditorModal from '../components/QuetionBank/QuestionEditorModal';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { fetchAssignmentsByQuestionBank } from '../services/assignmentSnapshotService';
import {
    fetchQuestionBankDetail,
    fetchQuestionBankQuestions,
    deleteQuestionBankQuestion,
    publishQuestionBank,
    unpublishQuestionBank,
} from '../services/questionBankService';

const StatusBadge = ({ status }) => {
    const normalized = String(status || '').toLowerCase();


    const classes = {
        draft: 'bg-amber-50 text-amber-700 border border-amber-200',
        published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        archived: 'bg-slate-100 text-slate-600 border border-slate-200',
    };

    return (
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${classes[normalized] || classes.draft}`}>
            {status}
        </span>
    );
};

const VisibilityBadge = ({ isPublic }) => {
    return (
        <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border ${isPublic
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
        >
            {isPublic ? 'Public' : 'Private'}
        </span>
    );
};

const ChoiceBadge = ({ isCorrect }) => {
    return (
        <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isCorrect
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
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
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [linkedAssignments, setLinkedAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    const loadLinkedAssignments = async () => {
        setLoadingAssignments(true);
        try {
            const data = await fetchAssignmentsByQuestionBank(id);
            setLinkedAssignments(data);
        } catch (error) {
            toast.error(error.message || 'Failed to load linked assignments');
        } finally {
            setLoadingAssignments(false);
        }
    };

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

    const loadBank = async () => {
        setLoadingBank(true);
        try {
            const data = await fetchQuestionBankDetail(id);
            setBank(data);
        } catch (error) {
            setError(error.message || 'Failed to load question bank');
        } finally {
            setLoadingBank(false);
        }
    };

    const loadQuestions = async () => {
        setLoadingQuestions(true);
        try {
            const data = await fetchQuestionBankQuestions(id);
            setQuestions(data);
        } catch (error) {
            toast.error(error.message || 'Failed to load questions');
        } finally {
            setLoadingQuestions(false);
        }
    };

    useEffect(() => {
        loadBank();
        loadQuestions();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        loadLinkedAssignments();
    }, [id]);

    if (loadingBank) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading question bank...</p>
                </div>
            </div>
        );
    }

    if (error || !bank) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-red-300">error</span>
                    <h2 className="mt-3 text-lg font-bold text-slate-900">Cannot load question bank</h2>
                    <p className="mt-2 text-sm text-slate-500">{error || 'Question bank not found'}</p>
                    <Link
                        to="/instructor/question-banks"
                        className="inline-flex mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
                    >
                        Back to list
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <Link
                            to="/instructor/question-banks"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-3"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Back to Question Banks
                        </Link>

                        <h1 className="text-3xl font-black text-slate-900">{bank.Name}</h1>
                        <p className="text-sm text-slate-500 mt-2">
                            {bank.Description || 'No description'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {bank.IsPublic ? (
                            <button
                                type="button"
                                onClick={handleUnpublish}
                                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
                            >
                                Unpublish
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handlePublish}
                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
                            >
                                Publish
                            </button>
                        )}

                        <button
                            type="button"
                            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
                        >
                            Edit Bank
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-bold hover:opacity-90"
                        >
                            Add Question
                        </button>
                        <QuestionEditorModal
                            open={isCreateOpen}
                            mode="create"
                            bankId={id}
                            onClose={() => setIsCreateOpen(false)}
                            onSaved={() => {
                                loadBank();
                                loadQuestions();
                            }}
                        />

                        <QuestionEditorModal
                            open={!!editingQuestion}
                            mode="edit"
                            bankId={id}
                            initialData={editingQuestion}
                            onClose={() => setEditingQuestion(null)}
                            onSaved={() => {
                                loadBank();
                                loadQuestions();
                            }}
                        />
                        <button
                            type="button"
                            disabled={!bank?.IsPublic}
                            onClick={() =>
                                navigate(
                                    `/instructor/create-assignment-from-bank?courseId=${bank.CourseId}&sourceQuestionBankId=${bank.Id}`
                                )
                            }
                            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Assignment from this Bank
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                            <h2 className="text-base font-bold text-slate-900">Bank Overview</h2>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Course</p>
                                    <p className="text-sm font-medium text-slate-800 mt-1">{bank.CourseTitle || '-'}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <StatusBadge status={bank.Status} />
                                    <VisibilityBadge isPublic={bank.IsPublic} />
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Question Count</p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">{bank.QuestionCount}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created</p>
                                    <p className="text-sm text-slate-700 mt-1">{formatDateTime(bank.CreationTime)}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Updated</p>
                                    <p className="text-sm text-slate-700 mt-1">{formatDateTime(bank.LastModificationTime)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-3">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Questions</h2>
                                    <p className="text-sm text-slate-500">Read-only view for Phase 3 Part 1</p>
                                </div>
                            </div>

                            <div className="p-6">
                                {loadingQuestions ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm text-slate-500">Loading questions...</p>
                                    </div>
                                ) : questions.length === 0 ? (
                                    <div className="text-center py-14">
                                        <span className="material-symbols-outlined text-5xl text-slate-300">quiz</span>
                                        <h3 className="mt-3 text-lg font-bold text-slate-800">No questions yet</h3>
                                        <p className="mt-2 text-sm text-slate-500">
                                            This question bank is empty. Add the first question in the next step.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {questions.map((question, index) => (
                                            <div
                                                key={question.Id}
                                                className="border border-slate-200 rounded-2xl p-5 bg-slate-50/60"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                                                            {index + 1}
                                                        </div>

                                                        <div>
                                                            <h3 className="text-base font-bold text-slate-900 leading-7">
                                                                {question.Content}
                                                            </h3>

                                                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                                                <StatusBadge status={question.Status || 'Draft'} />
                                                                {question.Difficulty && (
                                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                                                                        {question.Difficulty}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                                                                <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
                                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Param A</p>
                                                                    <p className="text-sm font-bold text-slate-800 mt-1">
                                                                        {question.ParamA ?? '-'}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
                                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Param B</p>
                                                                    <p className="text-sm font-bold text-slate-800 mt-1">
                                                                        {question.ParamB ?? '-'}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
                                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Param C</p>
                                                                    <p className="text-sm font-bold text-slate-800 mt-1">
                                                                        {question.ParamC ?? '-'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {question.Explanation && (
                                                                <div className="mt-4 rounded-xl bg-white border border-slate-200 px-4 py-3">
                                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Explanation</p>
                                                                    <p className="text-sm text-slate-700 mt-1 leading-6">
                                                                        {question.Explanation}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingQuestion(question)}
                                                            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmDeleteId(question.Id)}
                                                            className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-5 pl-12">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {question.Choices.map((choice, choiceIndex) => (
                                                            <div
                                                                key={choice.Id}
                                                                className={`rounded-xl border px-4 py-3 bg-white ${choice.IsCorrect
                                                                    ? 'border-emerald-200'
                                                                    : 'border-slate-200'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                                            {String.fromCharCode(65 + choiceIndex)}
                                                                        </div>
                                                                        <p className="text-sm text-slate-800 leading-6">
                                                                            {choice.Content}
                                                                        </p>
                                                                    </div>

                                                                    <ChoiceBadge isCorrect={choice.IsCorrect} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Assignments created from this bank</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Snapshot assignments generated from the current question bank.
                            </p>
                        </div>
                    </div>

                    {loadingAssignments ? (
                        <div className="flex items-center gap-3 py-6">
                            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-slate-500">Loading assignments...</span>
                        </div>
                    ) : linkedAssignments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p className="text-sm font-semibold text-slate-700">No assignments have been created from this bank yet.</p>
                            <p className="text-xs text-slate-500 mt-2">
                                Publish the bank and create your first snapshot assignment.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-nowrap">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Assignment</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Section</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs text-center">Questions</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs text-center">Submissions</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {linkedAssignments.map((assignment) => (
                                        <tr key={assignment.Id} className="hover:bg-slate-50">
                                            <td className="px-4 py-4">
                                                <div className="min-w-[150px]">
                                                    <p className="font-semibold text-slate-900">{assignment.Name}</p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Pass {assignment.GradeToPass}/10 · {assignment.Duration} min
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-700">
                                                <div className="min-w-[120px]">
                                                    {assignment.Section
                                                        ? `${assignment.Section.Index}. ${assignment.Section.Title}`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-700 text-center font-medium">{assignment.QuestionCount}</td>
                                            <td className="px-4 py-4 text-slate-700 text-center font-medium">{assignment.SubmissionCount}</td>
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => navigate(`/instructor/assignments/${assignment.Id}/preview`)}
                                                    className="text-violet-600 hover:text-violet-800 font-bold text-sm whitespace-nowrap"
                                                >
                                                    Open →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {confirmDeleteId && (
                    <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4">
                        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 border border-red-100">
                                    <span className="material-symbols-outlined text-red-500 text-2xl">delete</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Delete Question</h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    Are you sure you want to delete this question? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(confirmDeleteId)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 shadow-sm shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default QuestionBankDetailPage;