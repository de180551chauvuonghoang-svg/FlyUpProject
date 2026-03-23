import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchAssignmentSnapshotDetail } from '../services/assignmentSnapshotService';

const AssignmentSnapshotPreviewPage = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState(null);

    useEffect(() => {
        const loadAssignment = async () => {
            setLoading(true);
            try {
                const data = await fetchAssignmentSnapshotDetail(assignmentId);
                setAssignment(data);
            } catch (error) {
                toast.error(error.message || 'Failed to load assignment preview');
            } finally {
                setLoading(false);
            }
        };

        if (assignmentId) {
            loadAssignment();
        }
    }, [assignmentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-slate-500">Loading assignment preview...</span>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <p className="text-lg font-bold text-slate-900">Assignment not found</p>
                    <button
                        type="button"
                        onClick={() => navigate('/instructor/create-assignment-from-bank')}
                        className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold"
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
                            Assignment Snapshot Preview
                        </p>
                        <h1 className="text-3xl font-black text-slate-900 mt-2">{assignment.Name}</h1>
                        <p className="text-slate-500 mt-2">
                            Review the copied snapshot data stored in Assignments / McqQuestions / McqChoices.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
                    >
                        Back
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-1">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Summary</h2>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Course</p>
                                <p className="text-sm text-slate-800 mt-1">{assignment.Course?.Title || '-'}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Section</p>
                                <p className="text-sm text-slate-800 mt-1">
                                    {assignment.Section ? `${assignment.Section.Index}. ${assignment.Section.Title}` : '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Question count</p>
                                <p className="text-sm text-slate-800 mt-1">{assignment.QuestionCount}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Duration</p>
                                <p className="text-sm text-slate-800 mt-1">{assignment.Duration} minutes</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Grade to pass</p>
                                <p className="text-sm text-slate-800 mt-1">{assignment.GradeToPass}/10</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Submissions</p>
                                <p className="text-sm text-slate-800 mt-1">{assignment.SubmissionCount}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Source question bank id</p>
                                <p className="text-xs text-slate-600 mt-1 break-all">{assignment.SourceQuestionBankId}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Assignment id</p>
                                <p className="text-xs text-slate-600 mt-1 break-all">{assignment.Id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-3">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-slate-900">Snapshot Questions</h2>
                                <span className="text-sm text-slate-500">{assignment.Questions?.length || 0} item(s)</span>
                            </div>

                            {assignment.Questions?.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                    <p className="text-sm font-semibold text-slate-700">No questions found in this snapshot.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {assignment.Questions.map((question, index) => (
                                        <div key={question.Id} className="rounded-2xl border border-slate-200 p-5">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                                                        Question {index + 1}
                                                    </p>
                                                    <p className="text-base font-semibold text-slate-900 mt-2">
                                                        {question.Content}
                                                    </p>
                                                </div>

                                                <div className="text-right text-xs text-slate-500 shrink-0">
                                                    <p>ID: {question.Id}</p>
                                                    <p className="mt-1">Source: {question.SourceQuestionBankQuestionId || '-'}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs">
                                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                                    <p className="font-semibold text-slate-500 uppercase tracking-wider">Difficulty</p>
                                                    <p className="mt-1 text-slate-800">{question.Difficulty || '-'}</p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                                    <p className="font-semibold text-slate-500 uppercase tracking-wider">IRT Params</p>
                                                    <p className="mt-1 text-slate-800">
                                                        A: {question.ParamA ?? '-'} | B: {question.ParamB ?? '-'} | C: {question.ParamC ?? '-'}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                                    <p className="font-semibold text-slate-500 uppercase tracking-wider">Choice count</p>
                                                    <p className="mt-1 text-slate-800">{question.Choices?.length || 0}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {(question.Choices || []).map((choice, choiceIndex) => (
                                                    <div
                                                        key={choice.Id}
                                                        className={`rounded-xl border px-4 py-3 ${choice.IsCorrect
                                                                ? 'border-emerald-300 bg-emerald-50'
                                                                : 'border-slate-200 bg-slate-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                                    Choice {String.fromCharCode(65 + choiceIndex)}
                                                                </p>
                                                                <p className="text-sm text-slate-900 mt-1">{choice.Content}</p>
                                                            </div>

                                                            <div className="text-right shrink-0">
                                                                {choice.IsCorrect && (
                                                                    <span className="inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                                                                        Correct
                                                                    </span>
                                                                )}
                                                                <p className="text-[10px] text-slate-500 mt-2 break-all">
                                                                    {choice.SourceQuestionBankChoiceId || '-'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentSnapshotPreviewPage;