import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    fetchAssignmentSnapshotDetail, 
    updateAssignmentSnapshot, 
    deleteAssignmentSnapshot,
    fetchSectionsByCourse,
    fetchQuestionBankQuestions
} from '../services/assignmentSnapshotService';

const DifficultyBadge = ({ difficulty }) => {
    const normalized = String(difficulty || '').toLowerCase();
    const colors = {
        easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[normalized] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
            {difficulty || 'Unset'}
        </span>
    );
};

const AssignmentSnapshotPreviewPage = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit Mode States
    const [editForm, setEditForm] = useState({
        name: '',
        duration: 30,
        gradeToPass: 8,
        sectionId: '',
    });
    const [sections, setSections] = useState([]);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
    const [loadingEditData, setLoadingEditData] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Filters for question selection
    const [questionSearch, setQuestionSearch] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');

    const loadAssignment = async () => {
        setLoading(true);
        try {
            const data = await fetchAssignmentSnapshotDetail(assignmentId);
            setAssignment(data);
            // Initialize edit form
            if (data) {
                setEditForm({
                    name: data.Name,
                    duration: data.Duration,
                    gradeToPass: data.GradeToPass,
                    sectionId: data.Section?.Id || '',
                });
                // Current snapshotted source IDs
                const currentSourceIds = (data.Questions || [])
                    .map(q => q.SourceQuestionBankQuestionId)
                    .filter(Boolean);
                setSelectedQuestionIds(new Set(currentSourceIds));
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load assignment preview');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (assignmentId) {
            loadAssignment();
        }
    }, [assignmentId]);

    const enterEditMode = async () => {
        setIsEditing(true);
        if (sections.length === 0 || bankQuestions.length === 0) {
            setLoadingEditData(true);
            try {
                const [sectionsData, questionsData] = await Promise.all([
                    fetchSectionsByCourse(assignment.Course.Id),
                    fetchQuestionBankQuestions(assignment.SourceQuestionBankId)
                ]);
                setSections(sectionsData);
                setBankQuestions(questionsData);
            } catch (error) {
                toast.error('Failed to load edit data');
            } finally {
                setLoadingEditData(false);
            }
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleQuestion = (id) => {
        setSelectedQuestionIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        if (!editForm.name.trim() || !editForm.sectionId) {
            toast.error('Please fill required fields');
            return;
        }
        if (selectedQuestionIds.size === 0) {
            toast.error('Please select at least one question');
            return;
        }

        setSaving(true);
        const toastId = toast.loading('Saving changes...');
        try {
            await updateAssignmentSnapshot(assignmentId, {
                ...editForm,
                questionIds: Array.from(selectedQuestionIds)
            });
            toast.success('Assignment updated successfully', { id: toastId });
            setIsEditing(false);
            await loadAssignment(); // Reload to get fresh data
        } catch (error) {
            toast.error(error.message || 'Failed to update assignment', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this assignment and all its snapshot data? This cannot be undone.')) {
            return;
        }

        const toastId = toast.loading('Deleting assignment...');
        try {
            await deleteAssignmentSnapshot(assignmentId);
            toast.success('Assignment deleted successfully', { id: toastId });
            navigate('/instructor/create-assignment-from-bank'); // Or another appropriate list page
        } catch (error) {
            toast.error(error.message || 'Failed to delete assignment', { id: toastId });
        }
    };

    const filteredQuestions = useMemo(() => {
        return bankQuestions.filter(q => {
            const matchesSearch = !questionSearch || q.Content.toLowerCase().includes(questionSearch.toLowerCase());
            const matchesDifficulty = !difficultyFilter || q.Difficulty === difficultyFilter;
            return matchesSearch && matchesDifficulty;
        });
    }, [bankQuestions, questionSearch, difficultyFilter]);

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
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex-1">
                        <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
                            Assignment Snapshot Preview {isEditing && '(EDIT MODE)'}
                        </p>
                        {isEditing ? (
                            <input 
                                name="name"
                                value={editForm.name}
                                onChange={handleEditChange}
                                className="text-3xl font-black text-slate-900 mt-2 bg-white border border-slate-200 rounded-xl px-4 py-2 w-full outline-none focus:border-violet-500"
                                placeholder="Assignment Name"
                            />
                        ) : (
                            <h1 className="text-3xl font-black text-slate-900 mt-2">{assignment.Name}</h1>
                        )}
                        <p className="text-slate-500 mt-2">
                            {isEditing 
                                ? 'Update the snapshotted questions or change basic information.'
                                : 'Review the copied snapshot data stored in Assignments / McqQuestions / McqChoices.'}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    disabled={saving}
                                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={enterEditMode}
                                    className="px-4 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-bold hover:bg-violet-100 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
                                >
                                    Back
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Summary Sidebar */}
                    <div className="xl:col-span-1">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">Summary</h2>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Course</p>
                                <p className="text-sm text-slate-800 mt-1">{assignment.Course?.Title || '-'}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Section</p>
                                {isEditing ? (
                                    <select
                                        name="sectionId"
                                        value={editForm.sectionId}
                                        onChange={handleEditChange}
                                        className="w-full mt-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
                                    >
                                        <option value="">Select section</option>
                                        {sections.map(s => (
                                            <option key={s.Id} value={s.Id}>{s.Index}. {s.Title}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-slate-800 mt-1">
                                        {assignment.Section ? `${assignment.Section.Index}. ${assignment.Section.Title}` : '-'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Question count</p>
                                <p className={`text-sm mt-1 font-bold ${isEditing ? 'text-violet-600' : 'text-slate-800'}`}>
                                    {isEditing ? selectedQuestionIds.size : assignment.QuestionCount}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Duration (min)</p>
                                {isEditing ? (
                                    <input 
                                        type="number"
                                        name="duration"
                                        value={editForm.duration}
                                        onChange={handleEditChange}
                                        className="w-full mt-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 font-bold"
                                    />
                                ) : (
                                    <p className="text-sm text-slate-800 mt-1">{assignment.Duration} minutes</p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Grade to pass</p>
                                {isEditing ? (
                                    <input 
                                        type="number"
                                        name="gradeToPass"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={editForm.gradeToPass}
                                        onChange={handleEditChange}
                                        className="w-full mt-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 font-bold"
                                    />
                                ) : (
                                    <p className="text-sm text-slate-800 mt-1">{assignment.GradeToPass}/10</p>
                                )}
                            </div>

                            {!isEditing && (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div className="xl:col-span-3">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-slate-900">
                                    {isEditing ? 'Sync from Question Bank' : 'Snapshot Questions'}
                                </h2>
                                <span className="text-sm text-slate-500">
                                    {isEditing ? `${selectedQuestionIds.size} selected` : `${assignment.Questions?.length || 0} item(s)`}
                                </span>
                            </div>

                            {isEditing && (
                                <div className="mb-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                            <input 
                                                type="text"
                                                value={questionSearch}
                                                onChange={(e) => setQuestionSearch(e.target.value)}
                                                placeholder="Search in bank..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-violet-500 transition-all"
                                            />
                                        </div>
                                        <select 
                                            value={difficultyFilter}
                                            onChange={(e) => setDifficultyFilter(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 outline-none focus:border-violet-500 appearance-none"
                                        >
                                            <option value="">All Difficulties</option>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {loadingEditData ? (
                                <div className="py-20 text-center">
                                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-sm text-slate-500 mt-4">Loading bank questions...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(isEditing ? filteredQuestions : assignment.Questions).map((question, index) => {
                                        const isSelected = isEditing && selectedQuestionIds.has(question.Id);
                                        return (
                                            <div 
                                                key={question.Id} 
                                                onClick={isEditing ? () => toggleQuestion(question.Id) : undefined}
                                                className={`rounded-2xl border p-5 transition-all ${
                                                    isEditing 
                                                        ? (isSelected ? 'border-violet-500 bg-violet-50/50 cursor-pointer' : 'border-slate-200 hover:border-slate-300 cursor-pointer opacity-70')
                                                        : 'border-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                    <div className="flex gap-3">
                                                        {isEditing && (
                                                            <div className={`mt-1 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                                                isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                                                            }`}>
                                                                {isSelected && <span className="material-symbols-outlined text-[16px] text-white font-bold">check</span>}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                                                                Question {index + 1}
                                                            </p>
                                                            <p className="text-base font-semibold text-slate-900 mt-2 line-clamp-2">
                                                                {question.Content}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {!isEditing && (
                                                        <div className="text-right text-xs text-slate-500 shrink-0">
                                                            <p>ID: {question.Id}</p>
                                                            <p className="mt-1">Source: {question.SourceQuestionBankQuestionId || '-'}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs">
                                                    <div className="rounded-xl bg-slate-50 border border-black/5 p-3">
                                                        <p className="font-semibold text-slate-400 uppercase tracking-wider">Difficulty</p>
                                                        <p className="mt-1 text-slate-800"><DifficultyBadge difficulty={question.Difficulty} /></p>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 border border-black/5 p-3">
                                                        <p className="font-semibold text-slate-400 uppercase tracking-wider">IRT Params</p>
                                                        <p className="mt-1 text-slate-800">
                                                            A: {question.ParamA ?? '-'} | B: {question.ParamB ?? '-'} | C: {question.ParamC ?? '-'}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 border border-black/5 p-3">
                                                        <p className="font-semibold text-slate-400 uppercase tracking-wider">Choice count</p>
                                                        <p className="mt-1 text-slate-800">{(question.Choices || question.QuestionBankChoices)?.length || 0}</p>
                                                    </div>
                                                </div>

                                                {!isEditing && (
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
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {isEditing && filteredQuestions.length === 0 && (
                                        <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl">
                                            <p className="text-slate-400 text-sm">No questions match your filter</p>
                                        </div>
                                    )}
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