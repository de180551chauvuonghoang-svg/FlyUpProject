import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    fetchInstructorCoursesForBank, 
    fetchSectionsByCourse, 
    fetchPublishedQuestionBanksByCourse,
    fetchQuestionBankQuestions,
    createAssignmentFromBank 
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

const CreateAssignmentFromBankPage = () => {
    const [courses, setCourses] = useState([]);
    const [sections, setSections] = useState([]);
    const [banks, setBanks] = useState([]);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());

    const [loadingMeta, setLoadingMeta] = useState(true);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [questionSearch, setQuestionSearch] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');

    const [createdResult, setCreatedResult] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const presetCourseId = searchParams.get('courseId') || '';
    const presetSourceQuestionBankId = searchParams.get('sourceQuestionBankId') || '';


    const [form, setForm] = useState({
        courseId: presetCourseId,
        sectionId: '',
        name: '',
        duration: 30,
        gradeToPass: 8,
        sourceQuestionBankId: presetSourceQuestionBankId,
    });

    useEffect(() => {
        const loadCourses = async () => {
            setLoadingMeta(true);
            try {
                const data = await fetchInstructorCoursesForBank();
                setCourses(data);
            } catch (error) {
                toast.error(error.message || 'Failed to load courses');
            } finally {
                setLoadingMeta(false);
            }
        };

        loadCourses();
    }, []);

    useEffect(() => {
        if (!form.courseId) {
            setSections([]);
            setBanks([]);
            setForm((prev) => ({
                ...prev,
                sectionId: '',
                sourceQuestionBankId: '',
            }));
            return;
        }

        const loadDependentData = async () => {
            setLoadingSections(true);
            setLoadingBanks(true);

            try {
                const [sectionsData, banksData] = await Promise.all([
                    fetchSectionsByCourse(form.courseId),
                    fetchPublishedQuestionBanksByCourse(form.courseId),
                ]);

                setSections(sectionsData);
                setBanks(banksData);

                // Don't clear preset bank if it matched
                if (form.sourceQuestionBankId && !banksData.some(b => b.Id === form.sourceQuestionBankId)) {
                    setForm(prev => ({ ...prev, sourceQuestionBankId: '' }));
                }
                
                setForm((prev) => ({
                    ...prev,
                    sectionId: '',
                }));
            } catch (error) {
                toast.error(error.message || 'Failed to load sections or banks');
            } finally {
                setLoadingSections(false);
                setLoadingBanks(false);
            }
        };

        loadDependentData();
    }, [form.courseId, form.sourceQuestionBankId]);

    // Fetch questions when bank is selected
    useEffect(() => {
        if (!form.sourceQuestionBankId) {
            setBankQuestions([]);
            setSelectedQuestionIds(new Set());
            return;
        }

        const loadQuestions = async () => {
            setLoadingQuestions(true);
            try {
                const questions = await fetchQuestionBankQuestions(form.sourceQuestionBankId);
                const publishedQuestions = questions.filter(q => String(q.Status || '').trim() === 'Published');
                setBankQuestions(questions);
                // Default select chỉ câu Published
                setSelectedQuestionIds(new Set(publishedQuestions.map(q => q.Id)));
            } catch {
                toast.error('Failed to load questions from bank');
            } finally {
                setLoadingQuestions(false);
            }
        };

        loadQuestions();
    }, [form.sourceQuestionBankId]);

    const filteredQuestions = useMemo(() => {
        return bankQuestions.filter(q => {
            const isPublished = String(q.Status || '').trim() === 'Published';
            const matchesSearch = !questionSearch || q.Content.toLowerCase().includes(questionSearch.toLowerCase());
            const matchesDifficulty = !difficultyFilter || q.Difficulty === difficultyFilter;
            return isPublished && matchesSearch && matchesDifficulty;
        });
    }, [bankQuestions, questionSearch, difficultyFilter]);

    const selectedCourse = useMemo(
        () => courses.find((course) => course.Id === form.courseId) || null,
        [courses, form.courseId]
    );

    const selectedSection = useMemo(
        () => sections.find((section) => section.Id === form.sectionId) || null,
        [sections, form.sectionId]
    );

    const selectedBank = useMemo(
        () => banks.find((bank) => bank.Id === form.sourceQuestionBankId) || null,
        [banks, form.sourceQuestionBankId]
    );

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === 'courseId') {
            setCreatedResult(null);
        }
    };

    const toggleQuestion = (id) => {
        setSelectedQuestionIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        // Chỉ select câu Published (filteredQuestions đã lọc sẵn)
        setSelectedQuestionIds(prev => {
            const next = new Set(prev);
            filteredQuestions.forEach(q => next.add(q.Id));
            return next;
        });
    };

    const handleClearAll = () => {
        setSelectedQuestionIds(new Set());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.courseId || !form.sectionId || !form.sourceQuestionBankId || !form.name.trim()) {
            toast.error('Please fill all required fields');
            return;
        }

        if (selectedQuestionIds.size === 0) {
            toast.error('Please select at least one question');
            return;
        }

        // Validate: total ≥10 AND each level ≥2
        const selectedQuestions = bankQuestions.filter(q => selectedQuestionIds.has(q.Id));
        const total = selectedQuestions.length;
        if (total < 10) {
            toast.error(`Assignment phải có ít nhất 10 câu hỏi (hiện chọn ${total} câu)`);
            return;
        }
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        selectedQuestions.forEach(q => { if (q.Difficulty in counts) counts[q.Difficulty]++; });
        const issues = Object.entries(counts).filter(([, v]) => v < 2).map(([d, v]) => `${d} (cần 2, có ${v})`);
        
        if (issues.length > 0) {
            toast.error(`Mỗi cấp độ phải có ít nhất 2 câu. Chưa đủ: ${issues.join('; ')}`);
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Creating assignment from question bank...');

        try {
            const result = await createAssignmentFromBank({
                courseId: form.courseId,
                sectionId: form.sectionId,
                name: form.name.trim(),
                duration: Number(form.duration),
                gradeToPass: Number(form.gradeToPass),
                sourceQuestionBankId: form.sourceQuestionBankId,
                questionIds: Array.from(selectedQuestionIds),
            });

            setCreatedResult(result);
            toast.success('Assignment created successfully', { id: toastId });

            setForm((prev) => ({
                ...prev,
                name: '',
            }));
        } catch (error) {
            toast.error(error.message || 'Failed to create assignment', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <InstructorLayout
            title="Create Assignment"
            subtitle="Snapshot selective questions from a bank into a new assignment"
        >
            {/* Back button */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => navigate('/instructor/question-banks')}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all group"
                >
                    <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                    Back to Question Bank
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white mb-8">Assignment Details</h2>

                        {loadingMeta ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-4">
                                <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
                                <p className="text-slate-400 text-sm">Loading courses...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Course *</label>
                                        <select
                                            name="courseId"
                                            value={form.courseId}
                                            onChange={handleChange}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all appearance-none"
                                        >
                                            <option value="" className="bg-slate-900">Select course</option>
                                            {courses.map((course) => (
                                                <option key={course.Id} value={course.Id} className="bg-slate-900">
                                                    {course.Title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Section *</label>
                                        <select
                                            name="sectionId"
                                            value={form.sectionId}
                                            onChange={handleChange}
                                            disabled={!form.courseId || loadingSections}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all appearance-none disabled:opacity-50"
                                        >
                                            <option value="" className="bg-slate-900">
                                                {loadingSections ? 'Loading sections...' : 'Select section'}
                                            </option>
                                            {sections.map((section) => (
                                                <option key={section.Id} value={section.Id} className="bg-slate-900">
                                                    {section.Index}. {section.Title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Assignment Name *</label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Java OOP Quiz 01"
                                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Duration (min) *</label>
                                        <input
                                            name="duration"
                                            type="number"
                                            min="1"
                                            value={form.duration}
                                            onChange={handleChange}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Grade To Pass *</label>
                                        <input
                                            name="gradeToPass"
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={form.gradeToPass}
                                            onChange={handleChange}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Published Question Bank *</label>
                                    <select
                                        name="sourceQuestionBankId"
                                        value={form.sourceQuestionBankId}
                                        onChange={handleChange}
                                        disabled={!form.courseId || loadingBanks}
                                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all appearance-none disabled:opacity-50"
                                    >
                                        <option value="" className="bg-slate-900">
                                            {loadingBanks ? 'Loading published banks...' : 'Select published question bank'}
                                        </option>
                                        {banks.map((bank) => (
                                            <option key={bank.Id} value={bank.Id} className="bg-slate-900">
                                                {bank.Name} ({bank.QuestionCount} questions)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={submitting || selectedQuestionIds.size === 0}
                                        className="w-full md:w-auto px-10 py-4 rounded-xl bg-purple-500 text-white text-md font-bold hover:bg-purple-600 shadow-xl shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting && <div className="w-4 h-4 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>}
                                        {submitting ? 'Creating...' : 'Create Assignment'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Question Selection Section */}
                    {form.sourceQuestionBankId && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">Select Questions</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Choose questions to include in this snapshot ({selectedQuestionIds.size} selected)
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleSelectAll}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all"
                                    >
                                        Select All
                                    </button>
                                    <button 
                                        onClick={handleClearAll}
                                        className="px-4 py-2 bg-white/5 hover:bg-rose-500/20 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-rose-400 transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

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

                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {loadingQuestions ? (
                                    <div className="py-20 text-center">
                                        <div className="w-8 h-8 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                                    </div>
                                ) : filteredQuestions.length === 0 ? (
                                    <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-slate-500 text-sm italic">No questions match your filters</p>
                                    </div>
                                ) : (
                                    filteredQuestions.map(q => {
                                        const isSelected = selectedQuestionIds.has(q.Id);
                                        return (
                                            <div 
                                                key={q.Id}
                                                onClick={() => toggleQuestion(q.Id)}
                                                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer ${
                                                    isSelected 
                                                    ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/5' 
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-1 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20 group-hover:border-white/40'
                                                    }`}>
                                                        {isSelected && <span className="material-symbols-outlined text-[16px] text-white font-bold">check</span>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <DifficultyBadge difficulty={q.Difficulty} />
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                {(q.Choices || []).length} Choices
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-200 line-clamp-3 leading-relaxed">
                                                            {q.Content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview/Result Section */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl sticky top-8">
                        <h2 className="text-lg font-bold text-white mb-6">Configuration Preview</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-all">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Course</p>
                                <p className="text-sm font-bold text-slate-300 truncate">{selectedCourse?.Title || 'Not selected'}</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-all">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Section</p>
                                <p className="text-sm font-bold text-slate-300">{selectedSection ? `${selectedSection.Index}. ${selectedSection.Title}` : 'Not selected'}</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-all">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Source Bank</p>
                                <p className="text-sm font-bold text-slate-300 truncate">{selectedBank?.Name || 'Not selected'}</p>
                                {selectedBank && (
                                    <div className="flex flex-col gap-1 mt-2">
                                        {(() => {
                                            const sel = bankQuestions.filter(q => selectedQuestionIds.has(q.Id));
                                            const counts = { Easy: 0, Medium: 0, Hard: 0 };
                                            sel.forEach(q => { if (q.Difficulty in counts) counts[q.Difficulty]++; });
                                            const totalOk = sel.length >= 10;
                                            return (
                                                <>
                                                    <p className={`text-[10px] font-black uppercase ${totalOk ? 'text-purple-400' : 'text-rose-400'}`}>
                                                        {selectedQuestionIds.size} / {bankQuestions.length} Questions selected
                                                    </p>
                                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className="bg-purple-500 h-full transition-all duration-500"
                                                            style={{ width: `${bankQuestions.length ? (selectedQuestionIds.size / bankQuestions.length) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1 mt-2">
                                                        {Object.entries(counts).map(([diff, count]) => {
                                                            const ok = count >= 2;
                                                            const colorBg = diff === 'Easy' ? 'bg-emerald-500/10' : diff === 'Medium' ? 'bg-amber-500/10' : 'bg-rose-500/10';
                                                            const colorText = diff === 'Easy' ? 'text-emerald-400' : diff === 'Medium' ? 'text-amber-400' : 'text-rose-400';
                                                            return (
                                                                <div key={diff} className={`rounded-lg p-1.5 text-center border ${ok ? `${colorBg} border-current/20` : 'bg-rose-500/10 border-rose-500/30'}`}>
                                                                    <p className={`text-[8px] font-bold uppercase ${ok ? colorText : 'text-rose-400'}`}>{diff}</p>
                                                                    <p className={`text-xs font-black ${ok ? colorText : 'text-rose-400'}`}>{count}<span className="text-[8px] opacity-60">/2</span></p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Snapshot Logic
                          </h4>
                          <ul className="text-[11px] text-slate-400 space-y-3 leading-relaxed font-medium">
                            <li className="flex gap-2">
                                <span className="text-purple-400">•</span>
                                Only selected questions are duplicated as independent MCQ entities
                            </li>
                            <li className="flex gap-2">
                                <span className="text-purple-400">•</span>
                                Choices are snapshotted with their correct status
                            </li>
                            <li className="flex gap-2">
                                <span className="text-purple-400">•</span>
                                Once created, the bank and assignment are decoupled
                            </li>
                          </ul>
                        </div>
                    </div>

                    {createdResult && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl shadow-emerald-500/10">
                            <div className="flex items-center gap-3 text-emerald-400 mb-6">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Success!</h3>
                                    <p className="text-xs text-emerald-400/60 uppercase font-bold tracking-widest">Assignment Created</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 mb-8">
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Snapshot ID</span>
                                    <span className="font-mono text-xs text-white truncate max-w-[120px]">{createdResult.assignmentId}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Questions</span>
                                    <span className="text-white font-black">{createdResult.questionCount}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/instructor/assignments/${createdResult.assignmentId}/preview`)}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    Go to Assignment <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setCreatedResult(null);
                                        setForm(prev => ({ ...prev, name: '', duration: 30, gradeToPass: 8 }));
                                        setSelectedQuestionIds(new Set());
                                    }}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl border border-white/10 transition-all"
                                >
                                    Create Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </InstructorLayout>
    );
};

export default CreateAssignmentFromBankPage;
