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
import InstructorLayout from '../components/InstructorLayout';

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

const InfoRow = ({ label, value }) => (
    <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-300">{value}</p>
    </div>
);

const AssignmentSnapshotPreviewPage = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const [editForm, setEditForm] = useState({ name: '', duration: 30, gradeToPass: 8, sectionId: '' });
    const [sections, setSections] = useState([]);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
    const [loadingEditData, setLoadingEditData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [questionSearch, setQuestionSearch] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');

    const loadAssignment = async () => {
        setLoading(true);
        try {
            const data = await fetchAssignmentSnapshotDetail(assignmentId);
            setAssignment(data);
            if (data) {
                setEditForm({ name: data.Name, duration: data.Duration, gradeToPass: data.GradeToPass, sectionId: data.Section?.Id || '' });
                const currentSourceIds = (data.Questions || []).map(q => q.SourceQuestionBankQuestionId).filter(Boolean);
                setSelectedQuestionIds(new Set(currentSourceIds));
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load assignment preview');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (assignmentId) loadAssignment(); }, [assignmentId]);

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
                // Chỉ lấy câu hỏi Published
                setBankQuestions(questionsData.filter(q => String(q.Status || '').trim() === 'Published'));
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
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        if (!editForm.name.trim() || !editForm.sectionId) { toast.error('Please fill required fields'); return; }
        if (selectedQuestionIds.size === 0) { toast.error('Please select at least one question'); return; }

        // Validate: total ≥10 AND each level ≥2
        const selectedQuestions = bankQuestions.filter(q => selectedQuestionIds.has(q.Id));
        const total = selectedQuestions.length;
        if (total < 10) {
            toast.error(`Assignment phải có ít nhất 10 câu hỏi (hiện có ${total} câu)`);
            return;
        }
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        selectedQuestions.forEach(q => { if (q.Difficulty in counts) counts[q.Difficulty]++; });
        const issues = Object.entries(counts).filter(([, v]) => v < 2).map(([d, v]) => `${d} (cần 2, có ${v})`);
        if (issues.length > 0) {
            toast.error(`Mỗi cấp độ phải có ít nhất 2 câu. Chưa đủ: ${issues.join('; ')}`);
            return;
        }

        setSaving(true);
        const toastId = toast.loading('Saving changes...');
        try {
            await updateAssignmentSnapshot(assignmentId, { ...editForm, questionIds: Array.from(selectedQuestionIds) });
            toast.success('Assignment updated successfully', { id: toastId });
            setIsEditing(false);
            await loadAssignment();
        } catch (error) {
            toast.error(error.message || 'Failed to update assignment', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        const toastId = toast.loading('Deleting assignment...');
        try {
            await deleteAssignmentSnapshot(assignmentId);
            toast.success('Assignment deleted successfully', { id: toastId });
            navigate('/instructor/question-banks');
        } catch (error) {
            toast.error(error.message || 'Failed to delete assignment', { id: toastId });
            setShowDeleteDialog(false);
        } finally {
            setDeleting(false);
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
            <InstructorLayout title="Assignment Preview" subtitle="Loading...">
                <div className="flex items-center justify-center py-40">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm">Loading assignment preview...</p>
                    </div>
                </div>
            </InstructorLayout>
        );
    }

    if (!assignment) {
        return (
            <InstructorLayout title="Assignment Preview" subtitle="Not found">
                <div className="flex items-center justify-center py-40">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">assignment_late</span>
                        <p className="text-lg font-bold text-white">Assignment not found</p>
                        <button onClick={() => navigate(-1)} className="mt-6 px-6 py-3 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition-all">
                            Go Back
                        </button>
                    </div>
                </div>
            </InstructorLayout>
        );
    }

    return (
        <>
        <InstructorLayout
            title={isEditing ? 'Edit Assignment' : 'Assignment Preview'}
            subtitle={isEditing ? 'Update questions or change basic assignment information.' : 'Review the snapshotted questions stored in this assignment.'}
        >
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            name="name"
                            value={editForm.name}
                            onChange={handleEditChange}
                            className="w-full text-2xl font-black text-white bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 transition-all"
                            placeholder="Assignment Name"
                        />
                    ) : (
                        <h1 className="text-2xl font-black text-white truncate">{assignment.Name}</h1>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 disabled:opacity-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                {saving && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={enterEditMode}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                                Edit
                            </button>
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                                Delete
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 transition-all"
                            >
                                Back
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="xl:col-span-1">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl sticky top-8 space-y-5">
                        <h2 className="text-lg font-bold text-white">Summary</h2>

                        <InfoRow label="Course" value={assignment.Course?.Title || '-'} />

                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section</p>
                            {isEditing ? (
                                <select
                                    name="sectionId"
                                    value={editForm.sectionId}
                                    onChange={handleEditChange}
                                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 transition-all appearance-none"
                                >
                                    <option value="" className="bg-slate-900">Select section</option>
                                    {sections.map(s => (
                                        <option key={s.Id} value={s.Id} className="bg-slate-900">{s.Index}. {s.Title}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm font-bold text-slate-300">
                                    {assignment.Section ? `${assignment.Section.Index}. ${assignment.Section.Title}` : '-'}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Question Count</p>
                            <p className={`text-sm font-black ${isEditing ? 'text-purple-400' : 'text-slate-300'}`}>
                                {isEditing ? selectedQuestionIds.size : assignment.QuestionCount}
                            </p>
                            {isEditing && (() => {
                                const sel = bankQuestions.filter(q => selectedQuestionIds.has(q.Id));
                                const counts = { Easy: 0, Medium: 0, Hard: 0 };
                                sel.forEach(q => { if (q.Difficulty in counts) counts[q.Difficulty]++; });
                                return (
                                    <div className="grid grid-cols-3 gap-1 mt-2">
                                        {Object.entries(counts).map(([diff, count]) => {
                                            const ok = count >= 2;
                                            const colorText = diff === 'Easy' ? 'text-emerald-400' : diff === 'Medium' ? 'text-amber-400' : 'text-rose-400';
                                            const colorBg = diff === 'Easy' ? 'bg-emerald-500/10' : diff === 'Medium' ? 'bg-amber-500/10' : 'bg-rose-500/10';
                                            return (
                                                <div key={diff} className={`rounded-lg p-1.5 text-center border ${ok ? `${colorBg} border-transparent` : 'bg-rose-500/10 border-rose-500/30'}`}>
                                                    <p className={`text-[8px] font-bold uppercase ${ok ? colorText : 'text-rose-400'}`}>{diff}</p>
                                                    <p className={`text-xs font-black ${ok ? colorText : 'text-rose-400'}`}>{count}<span className="text-[8px] opacity-60">/2</span></p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (min)</p>
                            {isEditing ? (
                                <input type="number" name="duration" value={editForm.duration} onChange={handleEditChange}
                                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-bold" />
                            ) : (
                                <p className="text-sm font-bold text-slate-300">{assignment.Duration} minutes</p>
                            )}
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grade To Pass</p>
                            {isEditing ? (
                                <input type="number" name="gradeToPass" step="0.1" min="0" max="10" value={editForm.gradeToPass} onChange={handleEditChange}
                                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-bold" />
                            ) : (
                                <p className="text-sm font-bold text-slate-300">{assignment.GradeToPass}/10</p>
                            )}
                        </div>

                        {!isEditing && (
                            <>
                                <InfoRow label="Submissions" value={assignment.SubmissionCount ?? 0} />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Source Bank ID</p>
                                    <p className="text-[11px] text-slate-500 break-all font-mono">{assignment.SourceQuestionBankId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assignment ID</p>
                                    <p className="text-[11px] text-slate-500 break-all font-mono">{assignment.Id}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Questions Panel */}
                <div className="xl:col-span-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                                {isEditing ? 'Select Questions' : 'Snapshot Questions'}
                            </h2>
                            <span className="text-sm text-slate-500 font-semibold">
                                {isEditing
                                    ? `${selectedQuestionIds.size} selected`
                                    : `${assignment.Questions?.length || 0} item(s)`}
                            </span>
                        </div>

                        {/* Edit mode filters */}
                        {isEditing && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                    <input
                                        type="text"
                                        value={questionSearch}
                                        onChange={(e) => setQuestionSearch(e.target.value)}
                                        placeholder="Search questions..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>
                                <select
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all appearance-none"
                                >
                                    <option value="" className="bg-slate-900">All Difficulties</option>
                                    <option value="Easy" className="bg-slate-900">Easy</option>
                                    <option value="Medium" className="bg-slate-900">Medium</option>
                                    <option value="Hard" className="bg-slate-900">Hard</option>
                                </select>
                            </div>
                        )}

                        {loadingEditData ? (
                            <div className="py-20 text-center">
                                <div className="w-8 h-8 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto" />
                                <p className="text-slate-400 text-sm mt-4">Loading bank questions...</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1 custom-scrollbar">
                                {(isEditing ? filteredQuestions : assignment.Questions || []).map((question, index) => {
                                    const isSelected = isEditing && selectedQuestionIds.has(question.Id);
                                    return (
                                        <div
                                            key={question.Id}
                                            onClick={isEditing ? () => toggleQuestion(question.Id) : undefined}
                                            className={`group rounded-2xl border p-5 transition-all ${
                                                isEditing
                                                    ? isSelected
                                                        ? 'bg-purple-500/10 border-purple-500/50 cursor-pointer shadow-lg shadow-purple-500/5'
                                                        : 'bg-white/5 border-white/10 hover:border-white/20 cursor-pointer opacity-60'
                                                    : 'bg-white/5 border-white/10'
                                            }`}
                                        >
                                            {/* Question Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                {isEditing && (
                                                    <div className={`mt-1 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20 group-hover:border-white/40'
                                                    }`}>
                                                        {isSelected && <span className="material-symbols-outlined text-[16px] text-white font-bold">check</span>}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                                                            Question {index + 1}
                                                        </p>
                                                        <DifficultyBadge difficulty={question.Difficulty} />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                            {(question.Choices || question.QuestionBankChoices || []).length} Choices
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-200 line-clamp-3 leading-relaxed">
                                                        {question.Content}
                                                    </p>
                                                </div>
                                                {!isEditing && (
                                                    <div className="text-right text-[10px] text-slate-600 shrink-0 font-mono">
                                                        <p>A: {question.ParamA ?? '-'} | B: {question.ParamB ?? '-'} | C: {question.ParamC ?? '-'}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Choices (view mode only) */}
                                            {!isEditing && (
                                                <div className="space-y-2 mt-3">
                                                    {(question.Choices || []).map((choice, ci) => (
                                                        <div
                                                            key={choice.Id}
                                                            className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-4 ${
                                                                choice.IsCorrect
                                                                    ? 'border-emerald-500/30 bg-emerald-500/10'
                                                                    : 'border-white/5 bg-white/5'
                                                            }`}
                                                        >
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                                                                    Choice {String.fromCharCode(65 + ci)}
                                                                </p>
                                                                <p className="text-sm text-slate-200">{choice.Content}</p>
                                                            </div>
                                                            {choice.IsCorrect && (
                                                                <span className="shrink-0 inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                                                    Correct
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {isEditing && filteredQuestions.length === 0 && (
                                    <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-slate-500 text-sm italic">No questions match your filter</p>
                                    </div>
                                )}

                                {!isEditing && (!assignment.Questions || assignment.Questions.length === 0) && (
                                    <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-slate-500 text-sm italic">No questions in this assignment</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </InstructorLayout>

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => !deleting && setShowDeleteDialog(false)}
                />
                {/* Dialog */}
                <div className="relative bg-[#1a1030] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-2xl text-rose-400">warning</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white">Xóa Assignment</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Hành động này không thể hoàn tác</p>
                        </div>
                    </div>

                    <p className="text-sm text-slate-300 mb-2">
                        Bạn có chắc chắn muốn xóa assignment này?
                    </p>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
                        <p className="text-sm font-bold text-white truncate">{assignment.Name}</p>
                        <p className="text-xs text-slate-400 mt-1">{assignment.QuestionCount} câu hỏi · {assignment.Duration} phút</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={deleting}
                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 disabled:opacity-50 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                        >
                            {deleting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                            {deleting ? 'Đang xóa...' : 'Xóa'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default AssignmentSnapshotPreviewPage;
